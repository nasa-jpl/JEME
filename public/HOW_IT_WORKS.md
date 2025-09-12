# JPL's Earth Modeling Enterprise (JEME) Publication Dashboard - How It Works 

## Summary

The JPL's Earth Modeling Enterprise (JEME) Publication Dashboard is a multi-component system designed for analyzing and visualizing scientific citation data across six NASA models: RAPID, CARDAMOM, CMS-Flux, ECCO, ISSM, and MOMO-CHEM. The system comprises three integrated components: a React-based web dashboard for visualization, an LLM-powered citation analyzer using Ollama, and a machine learning publication classifier using deep learning techniques.

## System Architecture Overview

```mermaid
graph TB
    subgraph "Data Sources"
        A[Raw Citation Data<br/>JSON Files] 
        B[CrossRef API]
        C[Publication Databases]
    end
    
    subgraph "Processing Pipeline"
        D[Publication Classifier<br/>Jupyter/Python]
        E[LLM Paper Analytics<br/>Python/Ollama]
        F[Data Processing<br/>dataUtils.js]
    end
    
    subgraph "Storage"
        G[Model JSON Files<br/>*_analyzed.json]
        H[Visualization Assets<br/>PNG Files]
    end
    
    subgraph "Frontend Application"
        I[React Dashboard<br/>science-model-dashboard]
        J[Model-Specific Views]
        K[Generic Components]
        L[Chart Components<br/>Recharts]
    end
    
    A --> D
    B --> D
    C --> D
    D --> G
    A --> E
    E --> G
    G --> F
    F --> I
    I --> J
    I --> K
    J --> L
    K --> L
```

## Component Deep Dive

### 1. JPL's Earth Modeling Enterprise (JEME) Publication Dashboard (React Application)

#### Architecture Pattern
The dashboard implements a **hybrid architecture** combining generic and model-specific components:

```mermaid
graph LR
    subgraph "Routing Layer"
        A[AppWithRouting.js]
    end
    
    subgraph "Configuration"
        B[modelConfig.js]
    end
    
    subgraph "Views"
        C[Generic Views<br/>GenericDashboard.js]
        D[Model-Specific Views<br/>RAPID/Dashboard.js]
    end
    
    subgraph "Components"
        E[Chart Components]
        F[UI Components]
    end
    
    subgraph "Utilities"
        G[dataUtils.js]
        H[chartUtils.js]
    end
    
    A --> B
    A --> C
    A --> D
    C --> E
    D --> E
    C --> F
    D --> F
    E --> G
    E --> H
```

#### Key Features
- **Multi-Model Support**: Centralized configuration system in `modelConfig.js`
- **Dynamic Routing**: URL-based navigation with model-specific and generic routes
- **Data Processing Pipeline**: Standardized data extraction and transformation
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Interactive Visualizations**: Recharts-based charts with dynamic updates

#### Model Configuration System
Each model is configured with:
- Display name and description
- Data path to JSON file
- Color theme
- Research domain
- GitHub and website links

#### Routing Architecture
```
/science-model-dashboard                     → Main dashboard
/science-model-dashboard/{modelName}         → Model dashboard
/science-model-dashboard/{modelName}/citations → Citations page
/science-model-dashboard/{modelName}/geographic-impact → Geographic analysis
/science-model-dashboard/{modelName}/research-domains → Domain analysis
```

### 2. LLM Paper Analytics

#### System Architecture

```mermaid
classDiagram
    class CitationAnalyzer {
        -config: Dict
        +__init__(config_file)
        +build_prompt(title, abstract, reference_method)
        +analyze_with_ollama(prompt)
        +analyze_papers(papers, reference_method)
        -_extract_json_response(output)
        -_default_response()
    }
    
    class OllamaService {
        <<interface>>
        +run(model, prompt)
    }
    
    class Configuration {
        +model_name: str
        +timeout: int
        +sleep_between_requests: int
        +analysis_categories: Dict
    }
    
    CitationAnalyzer --> OllamaService : uses
    CitationAnalyzer --> Configuration : contains
```

#### Key Features
- **Flexible Configuration**: Customizable analysis categories and engagement levels
- **Multiple LLM Support**: Works with any Ollama-compatible model
- **Robust Error Handling**: Graceful fallbacks for failed analyses
- **Batch Processing**: Sequential processing with rate limiting
- **Paper Classification**: 
    - Engagement levels (1-4)
    - Research domains
    - Geographic regions
    - Country identification

#### Engagement Level Classification

1. **Level 1**: Acknowledgement Citation
   - The work is mentioned only as background or context (e.g., in the introduction or related work) without using its data, methods, or results.
   - Example: "We build on prior work in X [Author, Year]."

2. **Level 2**: Data/Method Usage
   - The work's data, tools, or methods are applied as-is without modification. The citing paper relies on the resource to support its own results.
   - Example: Using a dataset or off-the-shelf model from the cited work.

3. **Level 3**: Model/Method Adaptation
   - The work's approach, data, or model is adapted, modified, or improved for new purposes. The citing paper adds innovation while leveraging the foundation.
   - Example: Altering an algorithm for a new domain, fine-tuning a model, or combining methods from multiple sources.

4. **Level 4**: Foundational Method
   - The cited work provides a conceptual or methodological foundation that is central to the citing research. Without it, the work would not exist in its current form.
   - Example: A theory, framework, or algorithm that becomes the main driver of the new research.

### 3. Publication Classifier

#### Machine Learning Architecture

```mermaid
graph TD
    subgraph "Input Processing"
        A[Publication Data] --> B[Text Preprocessing]
        B --> C[Feature Extraction]
    end
    
    subgraph "Classification Models"
        C --> D[Deep Learning Classifier<br/>Research Areas]
        C --> E[Sentence Transformers<br/>Semantic Matching]
        C --> F[Fuzzy Matching<br/>Keyword Analysis]
    end
    
    subgraph "Ensemble & Validation"
        D --> G[Confidence Scoring]
        E --> G
        F --> G
        G --> H[Context Validation]
        H --> I[Model Assignment]
    end
    
    subgraph "Output"
        I --> J[Model Classification<br/>with Confidence Score]
        I --> K[Performance Metrics]
        I --> L[Visualizations]
    end
```

#### Key Features
- **Multi-Model Classification**: Assigns publications to appropriate NASA models
- **Deep Learning Models**: For research area and keyword classification
- **Semantic Understanding**: Sentence transformers for context matching
- **Fuzzy Matching**: Flexible keyword matching with context validation
- **Performance Analysis**: Comprehensive metrics including F1, MCC, calibration
- **Visualization Suite**: 16+ different metric visualizations

#### Supported Models
- **ECCO**: Ocean circulation and climate
- **RAPID**: River discharge computation
- **ISSM**: Ice sheet modeling
- **CMS-Flux**: Carbon monitoring
- **CARDAMOM**: Carbon cycle framework
- **MOMO-CHEM**: Atmospheric chemistry

## Data Flow Pipeline

```mermaid
sequenceDiagram
    participant Raw as Raw Citations
    participant Class as Publication Classifier
    participant LLM as LLM Analytics
    participant Data as Data Processing
    participant UI as React Dashboard
    participant User as End User
    
    Raw->>Class: Classify publications
    Class->>Class: Apply ML models
    Class-->>Raw: Model assignments
    
    Raw->>LLM: Analyze citations
    LLM->>LLM: Generate prompts
    LLM->>LLM: Call Ollama API
    LLM-->>Raw: Enriched data
    
    Raw->>Data: Process JSON files
    Data->>Data: Extract publications
    Data->>Data: Calculate metrics
    Data->>Data: Process geography
    Data-->>UI: Standardized data
    
    UI->>UI: Route to views
    UI->>UI: Render charts
    UI-->>User: Interactive dashboard
```

## Technical Stack

### Frontend
- **Framework**: React 18.x
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build**: Create React App
- **Deployment**: GitHub Pages

### Backend Processing
- **Language**: Python 3.7+
- **LLM Integration**: Ollama
- **ML Libraries**: PyTorch, Transformers, scikit-learn
- **NLP**: spaCy, SentenceTransformers
- **Data Processing**: pandas, numpy
- **Fuzzy Matching**: RapidFuzz

### Data Storage
- **Format**: JSON files
- **Structure**: Standardized citation objects
- **Naming**: `{MODEL_NAME}_analyzed.json`

## Key Design Patterns

### 1. Configuration-Driven Development
- Centralized model configuration
- Flexible analysis categories
- Dynamic route generation

### 2. Component Composition
- Generic base components
- Model-specific overrides
- Shared chart components

### 3. Data Standardization
- Common extraction functions
- Unified data structure
- Consistent field naming

### 4. Error Resilience
- Graceful degradation
- Default fallbacks
- Comprehensive error handling

## System Integration Points

```mermaid
graph LR
    subgraph "External APIs"
        A[CrossRef API]
        B[Ollama API]
    end
    
    subgraph "Data Processing"
        C[Citation Analyzer]
        D[Publication Classifier]
    end
    
    subgraph "Data Layer"
        E[JSON Files]
        F[Model Configs]
    end
    
    subgraph "Presentation"
        G[React Dashboard]
        H[Chart Components]
    end
    
    A --> D
    B --> C
    C --> E
    D --> E
    E --> G
    F --> G
    G --> H
```

## Performance Characteristics

### Dashboard Performance
- **Initial Load**: ~2-3 seconds
- **Route Changes**: <500ms
- **Chart Updates**: Real-time
- **Data Processing**: Client-side, optimized

### LLM Analytics Performance
- **Per Paper**: 1-5 minutes (model dependent)
- **Batch Size**: Sequential processing
- **Timeout**: Configurable (default 600s)
- **Rate Limiting**: 1 second between requests

### Classifier Performance
- **Accuracy**: Model-specific F1 scores (0.xx-0.yy)
- **Processing Speed**: ~100 papers/minute
- **Memory Usage**: <2GB for full pipeline

## Deployment Architecture

```mermaid
graph TD
    subgraph "Development"
        A[Local Development<br/>npm start]
    end
    
    subgraph "Build Process"
        B[npm run build]
        C[Static Assets]
    end
    
    subgraph "Deployment"
        D[GitHub Pages<br/>npm run deploy]
    end
    
    subgraph "Analytics Pipeline"
        E[Ollama Server<br/>Local/Remote]
        F[Python Scripts<br/>Local Execution]
    end
    
    A --> B
    B --> C
    C --> D
    E --> F
    F --> C
```

## Security Considerations

1. **Data Privacy**: All processing happens locally
2. **API Security**: No sensitive data in client code
3. **Input Validation**: Sanitized user inputs
4. **Error Messages**: No sensitive information exposed
5. **Dependencies**: Regular security updates

## Scalability Considerations

### Current Limitations
- Sequential LLM processing
- Client-side data processing
- Static file storage

### Scaling Opportunities
1. **Parallel Processing**: Implement concurrent LLM calls
2. **Server-Side Processing**: Move heavy computations to backend
3. **Database Integration**: Replace JSON files with database
4. **Caching Layer**: Implement Redis/Memcached for frequent queries
5. **CDN Distribution**: Serve static assets via CDN

## Future Enhancement Opportunities

### Short-term
1. Real-time citation updates via API integration
2. User authentication for personalized views
3. Export functionality for charts and data
4. Advanced filtering and search capabilities

### Medium-term
1. GraphQL API for efficient data fetching
2. Server-side rendering for improved SEO
3. Progressive Web App capabilities
4. Integration with citation databases

### Long-term
1. Machine learning predictions for citation trends
2. Collaborative features for researchers
3. API for third-party integrations
4. Multi-language support

## Maintenance Guidelines

### Regular Tasks
1. **Weekly**: Update citation data from sources
2. **Monthly**: Re-run LLM analysis for new papers
3. **Quarterly**: Retrain classification models
4. **Annually**: Review and update model configurations

### Monitoring Points
1. Dashboard load times
2. LLM processing success rates
3. Classification accuracy metrics
4. User engagement analytics

## Conclusion

The JPL's Earth Modeling Enterprise (JEME) Publication Dashboard represents a comprehensive solution for scientific citation analysis, combining modern web technologies with advanced machine learning and LLM capabilities. The modular architecture ensures maintainability and extensibility, while the multi-model support provides flexibility for diverse research domains. The system successfully bridges the gap between raw citation data and actionable insights through intelligent processing and intuitive visualization.
