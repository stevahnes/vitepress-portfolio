<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import jsPDF from 'jspdf'
import { Resume } from './resume_builder/models'
import { Cursor } from './resume_builder/class'
import { parseResumeMarkdown } from './resume_builder/mapper'
import { OnePageStandard } from './resume_builder/templates/one-page-standard/constants';
import { generateOnePageStandardPDF } from './resume_builder/templates/one-page-standard/logic'
import { useData } from 'vitepress'

// Access VitePress theme data
const { isDark } = useData()

// Props for customization
const props = defineProps({
    filename: {
        type: String,
        default: 'Stevanus SATRIA.pdf'
    },
    buttonText: {
        type: String,
        default: 'Download Resume'
    },
    buttonClass: {
        type: String,
        default: 'download-button'
    },
    openInNewTab: {
        type: Boolean,
        default: false
    }
})

// Use client-side only rendering to prevent hydration mismatch
const mounted = ref(false)
onMounted(() => {
    mounted.value = true
})

// Compute button class based on theme
const themeClass = computed(() => {
    if (!mounted.value) return '' // Prevent hydration mismatch
    return isDark.value ? 'dark-mode' : 'light-mode'
})

// Store the markdown content
const resumeMarkdown = ref<string>('')

// Extract the markdown content from the VitePress page
onMounted(() => {
    // Get the content div that VitePress generates for the markdown page
    const contentElement = document.querySelector('.vp-doc')

    if (contentElement) {
        // Clone the content to avoid modifying the DOM
        const contentClone = contentElement.cloneNode(true) as HTMLElement

        // Remove the download button to avoid including it in the resume markdown
        const downloadButtonContainer = contentClone.querySelector('div[style*="text-align: right"]')
        if (downloadButtonContainer) {
            downloadButtonContainer.remove()
        }

        // Get the markdown content as HTML and convert to plain text
        resumeMarkdown.value = getMarkdownFromHTML(contentClone)
    } else {
        console.error('Could not find VitePress markdown content')
    }
})

// Function to convert HTML to plain text while preserving markdown structure
function getMarkdownFromHTML(element: HTMLElement): string {
    // Start with empty string
    let markdown = ''

    // Process headings, paragraphs, lists, etc.
    const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || ''
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            const tagName = el.tagName.toLowerCase()

            // Process all child nodes for elements that might contain formatted content
            const processChildren = () => {
                let content = ''
                el.childNodes.forEach(child => {
                    content += processNode(child)
                })
                return content
            }

            // Handle different HTML tags with corresponding markdown
            switch (tagName) {
                case 'h1':
                    return `# ${processChildren()}\n\n`
                case 'h2':
                    return `## ${processChildren()}\n\n`
                case 'h3':
                    return `### ${processChildren()}\n\n`
                case 'p':
                    return `${processChildren()}\n\n`
                case 'ul':
                    let listItems = ''
                    el.querySelectorAll('li').forEach(li => {
                        // Process each list item to handle nested elements
                        listItems += `- ${processNode(li)}\n`
                    })
                    return listItems + '\n'
                case 'li':
                    return processChildren()
                case 'a':
                    return `[${el.textContent}](${el.getAttribute('href')})`
                case 'strong':
                case 'b':
                    return `**${processChildren()}**`
                case 'br':
                    return '\n'
                default:
                    // Process children for other elements
                    return processChildren()
            }
        }

        return ''
    }
    // Process all child nodes
    element.childNodes.forEach(child => {
        markdown += processNode(child)
    })

    return markdown
}

// Generate and download the PDF
function downloadResume() {
    if (!resumeMarkdown.value) {
        console.error('Resume markdown content not found')
        return
    }

    try {
        // Parse the markdown to get the Resume object
        const resume: Resume = parseResumeMarkdown(resumeMarkdown.value)

        // Create a new PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // Initialize cursor for PDF generation
        const cursor = new Cursor(0, 0, OnePageStandard.HEADER_FONT_SIZE)

        // Call the provided function to generate the PDF
        generateOnePageStandardPDF(resume, doc, cursor)

        if (props.openInNewTab) {
            // Use a direct data URL approach for better browser compatibility
            const pdfBase64 = doc.output('dataurlstring');

            // First cleanup the title for safe use in filename
            const safeFilename = props.filename.replace(/\.pdf$/, '');

            // Open the PDF directly in a new tab
            const newTab = window.open(pdfBase64, '_blank');

            // If the new tab was blocked, fall back to download
            if (!newTab) {
                console.error('Failed to open new tab. Pop-up blocker might be enabled.');
                doc.save(props.filename);
            } else {
                // Set the tab title programmatically
                setTimeout(() => {
                    try {
                        if (newTab.document) {
                            newTab.document.title = safeFilename;
                        }
                    } catch (e) {
                        console.warn('Could not set PDF tab title due to cross-origin restrictions');
                    }
                }, 100);
            }
        } else {
            // Save the PDF with the provided filename
            doc.save(props.filename);
        }
    } catch (error) {
        console.error('Error generating PDF:', error)
    }
}
</script>

<template>
    <button :class="[buttonClass, mounted ? themeClass : '']" @click="downloadResume">
        {{ buttonText || 'Download Resume' }}
    </button>
</template>

<style scoped>
.download-button {
    border: none;
    padding: 10px 26px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 20px;
    font-weight: 500;
    transition: background-color 0.3s, color 0.3s, border-color 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* Light mode (default) - matches the provided screenshot */
.light-mode {
    background-color: #3e94e8;
    color: white;
}

.light-mode:hover {
    background-color: #2a7fd1;
}

/* Dark mode */
.dark-mode {
    background-color: #0059aa;
    color: white;
}

.dark-mode:hover {
    background-color: #004c91;
}

/* Initial state before hydration - similar to dark mode to prevent flash */
.download-button:not(.light-mode):not(.dark-mode) {
    background-color: #0059aa;
    color: white;
}

@media (prefers-color-scheme: dark) {

    /* For SSR rendering before hydration */
    .download-button:not(.light-mode):not(.dark-mode) {
        background-color: #3e94e8;
        color: white;
    }
}
</style>