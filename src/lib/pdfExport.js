import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function savePdf(pdf, fileName) {
  const blobUrl = URL.createObjectURL(pdf.output('blob'))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}

function addFallbackSection(pdf, title, lines, yStart) {
  let y = yStart
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text(title, 40, y)
  y += 22

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  lines.forEach((line) => {
    if (y > 780) {
      pdf.addPage()
      y = 40
    }
    pdf.text(String(line), 50, y)
    y += 16
  })

  return y + 14
}

export async function exportElementToPdf({ element, fileName, fallbackTitle, fallbackSections = [] }) {
  try {
    if (!element) throw new Error('No hay contenido para exportar.')

    const canvas = await html2canvas(element, {
      backgroundColor: '#0f1117',
      logging: false,
      scale: 1.5,
      useCORS: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    if (!canvas.width || !canvas.height) throw new Error('La captura del reporte salio vacia.')

    const width = canvas.width / 1.5
    const height = canvas.height / 1.5
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width, height] })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height)
    savePdf(pdf, fileName)
    return
  } catch (error) {
    console.error(error)
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  pdf.setFillColor(15, 17, 23)
  pdf.rect(0, 0, 595, 842, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text(fallbackTitle, 40, 50)

  pdf.setTextColor(156, 163, 175)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Exportacion generada como respaldo cuando la captura visual no estuvo disponible.', 40, 74)

  pdf.setTextColor(255, 255, 255)
  let y = 112
  fallbackSections.forEach((section) => {
    y = addFallbackSection(pdf, section.title, section.lines, y)
  })

  savePdf(pdf, fileName)
}
