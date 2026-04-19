# 🛡️ CyberAegXs | Secure PDF Scanner & AI Document Intelligence

**CyberAegXs** is a next-generation, high-security document management platform. Designed with a "Cyber-First" approach, it combines advanced PDF editing capabilities with isolated AI processing nodes to ensure maximum privacy, data integrity, and structural security.

![CyberAegXs Logo](/public/CyberAegXs%20Logo.png)

## 🚀 Key Capabilities

### ⚡ Neural Scanning & OCR
*   **Scan to PDF**: High-precision mobile-ready scanning with auto-edge detection and perspective correction.
*   **Intelligent OCR**: Extract editable text from scanned documents and images using high-fidelity neural engines.
*   **Smart Naming**: AI-driven file naming based on document context and semantic analysis.

### 🛡️ Cyber Security Vault
*   **Deep Structural Audit**: Scans PDFs for hidden JavaScript execution triggers, suspicious objects, and malware signatures.
*   **PII Neural Inspection**: Automatically detects sensitive data like Aadhaar numbers, PAN cards, emails, and credentials.
*   **Isolated V8 Sandbox**: All document processing occurs in ephemeral memory containers to ensure zero data retention.

### 🤖 AI-Powered Forensics
*   **Chat with PDF**: Interactive Q&A interface to query document content directly.
*   **Neural Summarization**: Generate concise, professional summaries of complex PDF files.
*   **Security Posture Reporting**: Comprehensive risk scoring (0-100) for every analyzed document.

### 🛠️ Precision PDF Toolkit
*   **Organize**: Interactive drag-and-drop page reordering and rotation.
*   **Split & Extract**: Partition documents by ranges or isolate specific pages into new assets.
*   **Compress**: High-efficiency byte-stream optimization to reduce file size without quality loss.
*   **Conversion Suite**: Seamless transformation between PDF, Word (.docx), JPG, and PowerPoint (.pptx).

## 💻 Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **UI/UX**: React 19, Tailwind CSS v4, Framer Motion, Lucide Icons
*   **Components**: Shadcn UI (Customized with Cyber/Metallic theme)
*   **AI Engine**: Google Genkit (Gemini 2.5 Flash / Image / TTS)
*   **Backend & Auth**: Firebase (Authentication, Firestore)
*   **Payment Gateway**: Razorpay Integration
*   **PDF Processing**: pdf-lib, pdfjs-dist, pdf-parse, Tesseract.js

## 🛠️ Getting Started

### Prerequisites
*   Node.js 20+
*   Firebase Project Credentials
*   Google AI (Gemini) API Key

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/cyber-aegxs.git
    cd cyber-aegxs
    ```

2.  **Environment Setup**:
    Create a `.env` file and add your credentials:
    ```env
    GEMINI_API_KEY=your_gemini_key
    RAZORPAY_KEY_ID=your_razorpay_id
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🏗️ Architecture

The project follows a modular architecture:
*   `src/ai/flows`: Dedicated Genkit flows for AI processing.
*   `src/app/actions`: Server-side PDF manipulation logic using `pdf-lib`.
*   `src/components`: Specialized UI components for tools and dashboards.
*   `src/firebase`: Real-time state synchronization and authentication logic.

## 📜 License

CyberAegXs is a proprietary architecture. All rights reserved.

---
**Secure your documents. Empower your workflow.** 🚀🛡️✨