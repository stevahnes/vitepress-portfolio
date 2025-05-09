<script setup lang="ts">
import { ref, onMounted } from 'vue'
import jsPDF from 'jspdf'
import { Resume } from './resume_builder/models'
import { Cursor } from './resume_builder/class'
import { parseResumeMarkdown } from './resume_builder/mapper'
import { OnePageStandard } from './resume_builder/templates/one-page-standard/constants';
import { generateOnePageStandardPDF } from './resume_builder/templates/one-page-standard/logic'

// Props for customization
defineProps({
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
    }
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

            // Handle different HTML tags with corresponding markdown
            switch (tagName) {
                case 'h1':
                    return `# ${el.textContent}\n\n`
                case 'h2':
                    return `## ${el.textContent}\n\n`
                case 'h3':
                    return `### ${el.textContent}\n\n`
                case 'p':
                    return `${el.textContent}\n\n`
                case 'ul':
                    let listItems = ''
                    el.querySelectorAll('li').forEach(li => {
                        listItems += `- ${li.textContent}\n`
                    })
                    return listItems + '\n'
                case 'a':
                    return `[${el.textContent}](${el.getAttribute('href')})`
                case 'strong':
                case 'b':
                    return `**${el.textContent}**`
                case 'br':
                    return '\n'
                default:
                    // Process children for other elements
                    let content = ''
                    el.childNodes.forEach(child => {
                        content += processNode(child)
                    })
                    return content
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
        // Note: This function is assumed to be imported or defined elsewhere
        generateOnePageStandardPDF(resume, doc, cursor)

        // Save the PDF with the provided filename
        doc.save(props.filename)
    } catch (error) {
        console.error('Error generating PDF:', error)
    }
}
</script>

<template>
    <button :class="buttonClass" @click="downloadResume">
        {{ buttonText || 'Download Resume' }}
    </button>
</template>

<style scoped>
.download-button {
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 10px 24px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 4px;
    font-weight: 600;
    transition: background-color 0.3s;
}

.download-button:hover {
    background-color: #45a049;
}
</style>