"""Shared LLM client for the citation-analysis scripts.

All analysis scripts call the LLM through this one module instead of each
carrying their own copy of a provider-specific request function. The backend is
**AWS Bedrock** (Anthropic Claude), authenticated with the bearer token in
``.env.bedrock`` (``AWS_BEARER_TOKEN_BEDROCK``).

Usage:
    from llm_client import call_llm
    data = call_llm("Return JSON {...}", system=SYSTEM_PROMPT, temperature=0.1)

Configuration (env vars, with defaults):
    AWS_BEARER_TOKEN_BEDROCK   bearer token (loaded from .env.bedrock if unset)
    BEDROCK_MODEL_ID           default: us.anthropic.claude-sonnet-4-5-20250929-v1:0
    BEDROCK_REGION             default: us-east-1

Requires: boto3>=1.35 (botocore with bearer-token Bedrock support).
"""

import json
import os
import re
import time

import boto3
from botocore.exceptions import ClientError

# --- Configuration ---------------------------------------------------------
DEFAULT_MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
DEFAULT_REGION = "us-east-1"
ANTHROPIC_VERSION = "bedrock-2023-05-31"

MAX_RETRIES = 5
BASE_BACKOFF = 2  # seconds; exponential

# Errors worth retrying (throttling / transient server issues).
_RETRYABLE_CODES = {
    "ThrottlingException", "TooManyRequestsException", "ServiceUnavailableException",
    "ModelTimeoutException", "InternalServerException", "ModelNotReadyException",
}

_CLIENT = None


def _load_env_bedrock():
    """Populate AWS_BEARER_TOKEN_BEDROCK from .env.bedrock if not already set."""
    if os.environ.get("AWS_BEARER_TOKEN_BEDROCK"):
        return
    here = os.path.dirname(os.path.abspath(__file__))
    # Look in repo root (parent of scripts/) and the scripts dir itself.
    for path in (os.path.join(here, "..", ".env.bedrock"),
                 os.path.join(here, ".env.bedrock")):
        if os.path.exists(path):
            with open(path) as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())
            return


def _client():
    global _CLIENT
    if _CLIENT is None:
        _load_env_bedrock()
        if not os.environ.get("AWS_BEARER_TOKEN_BEDROCK"):
            raise RuntimeError(
                "AWS_BEARER_TOKEN_BEDROCK not set. Add it to .env.bedrock or the "
                "environment before calling the LLM."
            )
        region = os.environ.get("BEDROCK_REGION", DEFAULT_REGION)
        _CLIENT = boto3.client("bedrock-runtime", region_name=region)
    return _CLIENT


def _strip_code_fences(text):
    """Remove ```json ... ``` / ``` ... ``` wrappers Claude adds around JSON."""
    t = text.strip()
    if t.startswith("```"):
        # Drop the opening fence line (``` or ```json) and the trailing fence.
        t = re.sub(r"^```[a-zA-Z0-9]*\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def call_llm(prompt, system=None, temperature=0.1, max_tokens=4096,
             json_mode=True, model_id=None):
    """Call the configured Bedrock Claude model.

    Args:
        prompt: user message text.
        system: optional system prompt.
        temperature: sampling temperature.
        max_tokens: max output tokens.
        json_mode: if True, parse the response as JSON and return a dict/list;
            otherwise return the raw text string.
        model_id: override the model (default from BEDROCK_MODEL_ID env).

    Returns:
        Parsed JSON (dict/list) when json_mode, else the response text.

    Raises:
        RuntimeError after MAX_RETRIES failed attempts.
    """
    mid = model_id or os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL_ID)
    body = {
        "anthropic_version": ANTHROPIC_VERSION,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        body["system"] = system

    last_err = None
    for attempt in range(MAX_RETRIES):
        # --- transport: invoke + envelope (full retry/backoff on throttling) ---
        try:
            resp = _client().invoke_model(modelId=mid, body=json.dumps(body))
            payload = json.loads(resp["body"].read())
            text = payload["content"][0]["text"]
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            last_err = e
            if code in _RETRYABLE_CODES and attempt < MAX_RETRIES - 1:
                time.sleep(BASE_BACKOFF * (2 ** attempt))
                continue
            raise RuntimeError(f"Bedrock call failed ({code}): {e}") from e
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            # Malformed Bedrock envelope — transient, retry with backoff.
            last_err = e
            if attempt < MAX_RETRIES - 1:
                time.sleep(BASE_BACKOFF * (2 ** attempt))
                continue
            raise RuntimeError(
                f"Bedrock envelope parse failed after {MAX_RETRIES} attempts: {e}"
            ) from e

        # --- content parsing ---
        if not json_mode:
            return text
        try:
            return json.loads(_strip_code_fences(text))
        except json.JSONDecodeError as e:
            # The model returned non-JSON. Retry once (up to 2 total) in case it
            # was a one-off; a persistent non-JSON reply is a prompt problem, not
            # a transient error, so we don't burn all MAX_RETRIES on it.
            last_err = e
            if attempt < 1:
                continue
            raise RuntimeError(
                f"LLM did not return valid JSON: {e}. First 200 chars: {text[:200]!r}"
            ) from e
    raise RuntimeError(f"Bedrock call failed after {MAX_RETRIES} attempts: {last_err}")


def call_gemini(*args, **kwargs):
    """Deprecated compatibility shim for the old per-script call_gemini().

    Historically scripts called call_gemini with varying positional orders:
    (prompt, api_key), (api_key, prompt), and an optional trailing temperature.
    We ignore the api_key (Bedrock owns auth) and forward the prompt/temperature
    to call_llm. Prefer importing call_llm directly in new/edited code.
    """
    prompt = None
    temperature = kwargs.pop("temperature", 0.1)
    system = kwargs.pop("system", None)

    positional = list(args)
    # Pull an explicit prompt kwarg if provided.
    if "prompt" in kwargs:
        prompt = kwargs.pop("prompt")
    # A trailing numeric positional is the temperature.
    if positional and isinstance(positional[-1], (int, float)):
        temperature = positional.pop()
    if prompt is None:
        # Heuristic: the prompt is the longer of the (prompt, api_key) pair;
        # api keys are short single tokens with no spaces.
        candidates = [a for a in positional if isinstance(a, str)]
        if len(candidates) == 1:
            prompt = candidates[0]
        elif len(candidates) >= 2:
            prompt = max(candidates, key=lambda s: (" " in s, len(s)))
    if prompt is None:
        raise ValueError("call_gemini shim could not identify the prompt argument")

    return call_llm(prompt, system=system, temperature=temperature,
                    json_mode=kwargs.pop("json_mode", True))


if __name__ == "__main__":
    # Smoke test
    print("Model:", os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL_ID))
    print(call_llm('Return JSON only: {"ok": true, "n": 42}'))
