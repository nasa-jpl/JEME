#!/usr/bin/env python3
"""
Relevance guards for team-paper (seed) selection.

The JPL-affiliation check in expand_seed_list.py answers "is this author on the
team?" but not "is this paper the team's model work?". Two failure modes slipped
through and inflated the RAPID/MOMO-CHEM datasets:

  A. Community assessments -- a team member is one of 30+ co-authors on a
     field-wide assessment (Dentener et al. nitrogen deposition, 37 authors,
     pulled in 903 citing papers). Its citations measure the field, not the model.

  B. Adjacent research threads -- genuinely the team's own papers, but a
     different model/topic (RAPID's authors also publish GRACE groundwater and
     evapotranspiration work, which shares generic hydrology vocabulary:
     "water", "basin", "discharge").

Guard A rejects papers where the team author is neither a lead (first 3) nor the
senior (last) author, unless the author list is small enough that position
carries no signal. Guard B requires a model-specific core term and rejects
known adjacent-thread terms.
"""
import re

# Papers with <= this many authors: position carries no signal, skip Guard A.
SMALL_TEAM = 5
# Author must be in the first N positions, or be the last (senior) author.
LEAD_POSITIONS = 3

# Model-specific subject terms. A candidate must match at least one.
CORE_TERMS = {
    "CMS-Flux": ["co2 flux", "carbon flux", "carbon monitoring", "inversion",
                 "inverse model", "methane emission", "ch4 emission", "co2 emission",
                 "carbon budget", "flux estimate", "atmospheric transport",
                 "data assimilation", "oco-2", "surface flux", "carbon cycle"],
    "RAPID": ["routing", "river network", "nhdplus", "nhd ", "streamflow",
              "river discharge", "river reach", "rivers", "swot", "sword",
              "hydrodynamic", "flood", "water surface elevation", "river flow"],
    "CARDAMOM": ["cardamom", "terrestrial carbon", "carbon cycle", "ecosystem",
                 "biomass", "gross primary produc", "gpp", "npp", "vegetation",
                 "land carbon", "soil carbon", "photosynthesis", "phenology",
                 "carbon flux", "data assimilation"],
    "LES": ["large eddy", "large-eddy", "les ", "turbulence", "turbulent",
            "boundary layer", "stratocumulus", "convect", "eddy", "subgrid",
            "plume dispersion", "entrainment"],
    "EDMF": ["edmf", "eddy diffusivity", "mass flux", "parameteriz", "convect",
             "boundary layer", "turbulence", "cloud", "entrainment"],
    "TROPESS": ["tropess", "cris", "airs", "tes ", "muses", "retrieval",
                "averaging kernel", "vertical profile", "tropospheric ozone",
                "carbon monoxide", "ammonia", "spectrometer", "sounder",
                "trace gas", "atmospheric composition", "reanalysis"],
    "MOMO-CHEM": ["momo", "chemical transport", "atmospheric chemistry", "ozone",
                  "no2", "nox", "air quality", "reanalysis", "tropospheric chem",
                  "aerosol", "emission inventory", "chemical reanalysis"],
}

# Adjacent-thread terms that disqualify even when a core term matches.
EXCLUDE_TERMS = {
    "CMS-Flux": [],
    "RAPID": ["grace", "groundwater", "evapotranspiration", "terrestrial water storage",
              "gravity recovery", "aral sea", "drought cascade", "sea level",
              "water table", "aquifer depletion", "mass conservation"],
    "CARDAMOM": [],
    "LES": ["modis cloud property", "failed retrieval", "imaging spectrometer",
            "oco-2", "instrument design"],
    "EDMF": [],
    "TROPESS": [],
    "MOMO-CHEM": [],
}


def _text(paper):
    t = paper.get("title") or ""
    if isinstance(t, list):
        t = t[0] if t else ""
    return (t + " " + (paper.get("abstract") or "")).lower()


def name_key(n):
    """(surname, first-initial) for a name; initial is None for a bare surname.

    Some curated seeds record authors as citation strings ("David et al.
    (2011)"), which yield a surname with no initial -- those match on surname
    alone.
    """
    n = re.sub(r"\(\d{4}\)|et al\.?", " ", (n or "").lower())
    parts = [p for p in re.split(r"[\s.,]+", n) if p]
    if not parts:
        return ("", None)
    if len(parts) == 1:
        return (parts[0], None)
    return (parts[-1], parts[0][0])


def author_position(authors, team_names):
    """Index of the first team author in `authors`, or None if absent.

    Matches on surname plus first initial so "A. A. Bloom" and "A. Bloom"
    agree; falls back to surname-only when the team name carries no initial.
    """
    tk = {name_key(n) for n in team_names if n}
    surnames_only = {s for s, i in tk if i is None}
    for idx, a in enumerate(authors):
        s, i = name_key(a)
        if (s, i) in tk or s in surnames_only:
            return idx
    return None


def passes_authorship(authors, team_names):
    """Guard A: team author must lead or be senior, unless the team is small."""
    n = len(authors)
    if n <= SMALL_TEAM:
        return True, "small author list"
    idx = author_position(authors, team_names)
    if idx is None:
        return False, f"no team author found among {n}"
    if idx < LEAD_POSITIONS or idx == n - 1:
        return True, f"lead/senior (pos {idx+1}/{n})"
    return False, f"minor co-author (pos {idx+1}/{n})"


def passes_topic(paper, model):
    """Guard B: require a model core term and no adjacent-thread term."""
    txt = _text(paper)
    core = CORE_TERMS.get(model, [])
    excl = EXCLUDE_TERMS.get(model, [])
    hit = next((c for c in core if c in txt), None)
    bad = next((e for e in excl if e in txt), None)
    if bad:
        return False, f"excluded term '{bad}'"
    if not hit:
        return False, "no model core term"
    return True, f"core term '{hit}'"


def evaluate(paper, model, authors, team_names):
    """Return (ok, reason). Both guards must pass."""
    ok_a, why_a = passes_authorship(authors, team_names)
    if not ok_a:
        return False, f"authorship: {why_a}"
    ok_b, why_b = passes_topic(paper, model)
    if not ok_b:
        return False, f"topic: {why_b}"
    return True, f"{why_a}; {why_b}"
