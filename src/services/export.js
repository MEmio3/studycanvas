import { getImage } from '../store/images.js';
import { AnnotationLayer } from '../components/AnnotationLayer.js';

export async function exportDeckAsJson(deck, pages) {
  const exportData = {
    deck: deck,
    pages: []
  };

  for (const page of pages) {
    const pageData = JSON.parse(JSON.stringify(page)); // Deep copy
    if (pageData.images) {
      for (const img of pageData.images) {
        const imgRecord = await getImage(img.storageKey);
        if (imgRecord && imgRecord.blob) {
          img.base64Data = await blobToBase64(imgRecord.blob);
        }
      }
    }
    exportData.pages.push(pageData);
  }

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'deck'}.studycanvas.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportDeckAsPdf(deck, pages) {
  if (!window.jspdf || !window.html2canvas) {
    alert("PDF export dependencies are loading. Please try again in a moment.");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [1280, 720]
  });

  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage();
    const page = pages[i];
    
    doc.setFont('helvetica');
    
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.text(page.title || `Page ${i + 1}`, 40, 50);
    
    if (page.topic) {
      doc.setFontSize(14);
      doc.setTextColor(29, 158, 117);
      doc.text(`Topic: ${page.topic}`, 40, 75);
    }

    if (page.images && page.images.length > 0) {
      const imgInfo = page.images[0];
      const imgRecord = await getImage(imgInfo.storageKey);
      
      if (imgRecord && imgRecord.blob) {
        const url = URL.createObjectURL(imgRecord.blob);
        
        const wrapper = document.createElement('div');
        wrapper.style.width = '600px';
        wrapper.style.height = '450px';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.backgroundColor = '#000';
        wrapper.style.overflow = 'hidden';
        wrapper.style.borderRadius = '8px';
        
        const innerWrapper = document.createElement('div');
        innerWrapper.style.position = 'relative';
        innerWrapper.style.display = 'inline-block';
        innerWrapper.style.maxWidth = '100%';
        innerWrapper.style.maxHeight = '100%';
        
        const imgEl = document.createElement('img');
        imgEl.style.display = 'block';
        imgEl.style.maxWidth = '100%';
        imgEl.style.maxHeight = '100%';
        imgEl.style.objectFit = 'contain';
        imgEl.src = url;
        
        const annContainer = document.createElement('div');
        
        innerWrapper.appendChild(imgEl);
        innerWrapper.appendChild(annContainer);
        wrapper.appendChild(innerWrapper);
        tempContainer.appendChild(wrapper);
        
        await new Promise((resolve) => {
          imgEl.onload = resolve;
          imgEl.onerror = resolve;
        });

        const layer = new AnnotationLayer(annContainer, imgInfo, page, false);
        layer.render();
        
        await new Promise(r => setTimeout(r, 100));

        try {
          const canvas = await window.html2canvas(wrapper, { backgroundColor: '#000', scale: 2 });
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          doc.addImage(imgData, 'JPEG', 40, 100, 600, 450);
        } catch(e) {
           console.error('Failed to capture image', e);
        }

        URL.revokeObjectURL(url);
        tempContainer.innerHTML = '';
      }
    } else {
       doc.setFontSize(16);
       doc.setTextColor(150, 150, 150);
       doc.text("No image provided.", 40, 100);
    }

    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    const text = page.textBlock?.rawText || 'No explanation provided.';
    const splitText = doc.splitTextToSize(text, 540);
    doc.text(splitText, 680, 100);

    if (page.textBlock?.source) {
       doc.setFontSize(12);
       doc.setTextColor(150, 150, 150);
       doc.text(`Source: ${page.textBlock.source}`, 680, 660);
    }

    if (page.videoTimestamp) {
       doc.setFontSize(12);
       doc.setTextColor(29, 158, 117);
       doc.text(`Captured from YouTube: ${page.videoTimestamp.videoTitle} @ ${page.videoTimestamp.formatted}`, 680, 680);
    }
  }

  document.body.removeChild(tempContainer);
  doc.save(`${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'deck'}.pdf`);
}
