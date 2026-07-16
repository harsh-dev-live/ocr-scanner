document.addEventListener('DOMContentLoaded', () => {
    // Inject PDFJS library environment pointers globally
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    // Core DOM Elements Accessors
    const mainContainer = document.getElementById('mainContainer');
    const settingsContainer = document.getElementById('settingsContainer');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const scanBtn = document.getElementById('scanBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const pdfCanvas = document.getElementById('pdfCanvas');

    // Structural Tracking State Variables
    let selectedFile = null;
    let extractedText = "";

    /* ==========================================
       LOCALSTORAGE STATE HANDLING & SYNC
       ========================================== */
    function initializePersistentState() {
        // Initialize Theme Values
        const savedTheme = localStorage.getItem('ios_dark_mode');
        if (savedTheme === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.checked = false;
        }

        // Recover Cached Text Session data if available
        const cachedText = localStorage.getItem('ocr_extracted_text');
        const cachedFileName = localStorage.getItem('ocr_file_meta');
        
        if (cachedText && cachedFileName) {
            extractedText = cachedText;
            fileInfo.textContent = `${cachedFileName} (Restored Session)`;
            
            // Re-highlight the UI download stack
            downloadBtn.disabled = false;
            downloadBtn.classList.add('highlighted');
            statusText.textContent = "Previous session text loaded from memory.";
        }
    }

    // Toggle and commit Dark Mode changes
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('ios_dark_mode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('ios_dark_mode', 'disabled');
        }
    });

    /* ==========================================
       MODAL NAVIGATION LAYER INTERACTIONS
       ========================================== */
    openSettingsBtn.addEventListener('click', () => {
        mainContainer.classList.add('id-blurred');
        settingsContainer.classList.remove('id-hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsContainer.classList.add('id-hidden');
        mainContainer.classList.remove('id-blurred');
    });

    /* ==========================================
       DRAG & DROP / FILE ACCESS MANAGERS
       ========================================== */
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        selectedFile = file;
        fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        
        scanBtn.disabled = false;
        downloadBtn.disabled = true;
        downloadBtn.classList.remove('highlighted');
        statusText.textContent = "Document loaded securely.";
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        
        // Clean cached functional state parameters on fresh configurations
        localStorage.removeItem('ocr_extracted_text');
        localStorage.removeItem('ocr_file_meta');
    }

    /* ==========================================
       OCR ENGINE WORKFLOW EXECUTION
       ========================================== */
    scanBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        scanBtn.disabled = true;
        progressContainer.style.display = 'block';
        statusText.textContent = "Initializing iOS Engine...";
        
        try {
            let scanSource = selectedFile;

            // Handle client-side binary PDF raster extraction natively
            if (selectedFile.type === "application/pdf") {
                statusText.textContent = "Rendering PDF structures dynamically...";
                scanSource = await convertPdfToCanvas(selectedFile);
            }

            statusText.textContent = "Analyzing structure layouts...";
            
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        statusText.textContent = `Scanning: ${Math.round(m.progress * 100)}%`;
                        progressBar.style.width = `${m.progress * 100}%`;
                    }
                }
            });

            // Adjust spatial detection criteria to maintain precise block spacing structure
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                preserve_interword_spaces: '1'
            });

            const { data: { text } } = await worker.recognize(scanSource);
            await worker.terminate();

            extractedText = text;
            
            if (extractedText.trim().length === 0) {
                 statusText.textContent = "Scan complete. No matching visual text found.";
                 scanBtn.disabled = false;
                 return;
            }

            statusText.textContent = "Scan finished successfully.";
            progressBar.style.width = '100%';
            
            // Highlight Download CTA element
            downloadBtn.disabled = false;
            downloadBtn.classList.add('highlighted');

            // Save state inside persistent memory limits
            localStorage.setItem('ocr_extracted_text', extractedText);
            localStorage.setItem('ocr_file_meta', selectedFile.name);

        } catch (error) {
            console.error(error);
            statusText.textContent = "Scanning failed. Check image illumination framework.";
            scanBtn.disabled = false;
        }
    });

    // Sub-routine processing layout engine for PDFs
    function convertPdfToCanvas(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function() {
                try {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const page = await pdf.getPage(1);
                    
                    const viewport = page.getViewport({ scale: 2.0 }); // High-definition supersampling for OCR accuracy
                    const context = pdfCanvas.getContext('2d');
                    pdfCanvas.height = viewport.height;
                    pdfCanvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    
                    await page.render(renderContext).promise;
                    resolve(pdfCanvas); 
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /* ==========================================
       TEXT EXPORT LINK PIPELINE
       ========================================== */
    downloadBtn.addEventListener('click', () => {
        if (!extractedText) return;

        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        const currentName = selectedFile ? selectedFile.name : (localStorage.getItem('ocr_file_meta') || 'document');
        const originalName = currentName.substring(0, currentName.lastIndexOf('.')) || currentName;
        link.setAttribute('download', `${originalName}_scanned.txt`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Run persistence layer initialization check
    initializePersistentState();
});