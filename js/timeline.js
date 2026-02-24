function createLines() {
	const bulles = document.querySelectorAll('.bulle');
	const timeline = document.getElementById('timeline');
	const LINE_WIDTH = 3; // épaisseur des lignes

	bulles.forEach(bulle => {

	const ancre = parseInt(bulle.dataset.ancre ?? 1);
	const left = bulle.offsetLeft;
	const width = bulle.offsetWidth;
	const right = parseInt(bulle.dataset.right ?? 0);
	const DRAWLINE = parseInt(bulle.dataset.drawline) || 0;// hauteur ou sarrete la ligne
	const axisX = bulle.offsetLeft;
	const OFFSET = parseInt(bulle.dataset.offset) || 0;
	let yCenter = bulle.offsetTop;	
	
	//ancrage de la bulle
	switch (ancre) {

	  // 0 → left = centre logique
	  case 0:
		bulle.style.left = (left - width / 2+OFFSET) + 'px';
		yCenter = bulle.offsetTop + bulle.offsetHeight / 2;
		break;

	  // 1 → left = gauche (normal)
	  case 1:
		bulle.style.left = left + OFFSET + 'px';
		yCenter = bulle.offsetTop + bulle.offsetHeight / 2;
		break;

	  // 2 → left = droite logique
	  case 2:
		bulle.style.left = (left - width) + 'px';
		break;

	  // 3 → banderole
	  case 3:
		const newWidth = right - left-LINE_WIDTH;
		bulle.style.left = left + LINE_WIDTH/2 + 'px';
		if (newWidth > 0) {
		  bulle.style.width = newWidth + 'px';
		}
		break;
	}

    // ===== Ligne verticale simple ou horizontale selon offset =====
	if (bulle.hasAttribute('data-drawline')) {
      const lineV = document.createElement('div');
      lineV.className = 'ligne-v';
      lineV.style.left = axisX - LINE_WIDTH/2 + 'px';
      lineV.style.top = yCenter + 'px';
      lineV.style.height = (DRAWLINE - yCenter) + 'px';
	  lineV.style.width = LINE_WIDTH + 'px';
      timeline.appendChild(lineV);

      if (OFFSET !== 0) {
        const lineH = document.createElement('div');
        lineH.className = 'ligne-h';
        lineH.style.top = yCenter + 'px';
        lineH.style.width = Math.abs(OFFSET) + 'px';
		lineH.style.height = LINE_WIDTH + 'px';
        lineH.style.left = OFFSET > 0
          ? axisX + 'px'
          : (axisX + OFFSET) + 'px';
        timeline.appendChild(lineH);
      }
    }

  });
}

window.addEventListener('load', createLines);


    // ===== Zoom et drag =====
	
let scale = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX, startY;

const viewport = document.getElementById('viewport');
const timeline = document.getElementById('timeline');

function updateTransform() {
  timeline.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// ===== ZOOM centré sur la souris =====
viewport.addEventListener('wheel', e => {
  e.preventDefault();

  const vpRect = viewport.getBoundingClientRect();

  // Position souris dans le viewport
  const mx = e.clientX - vpRect.left;
  const my = e.clientY - vpRect.top;

  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.min(Math.max(0.2, scale + delta), 4);

  // Conversion écran -> monde
  const worldX = (mx - posX) / scale;
  const worldY = (my - posY) / scale;

  scale = newScale;

  // Reprojection monde -> écran
  posX = mx - worldX * scale;
  posY = my - worldY * scale;

  updateTransform();
}, { passive: false });


// ===== DRAG souris =====
viewport.addEventListener('mousedown', e => {
  isDragging = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
  timeline.classList.add('dragging');
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  updateTransform();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  timeline.classList.remove('dragging');
});

// double face
const bulles = document.querySelectorAll('.bulle');

function resetBulles() {
  document.querySelectorAll('.bulle.selected').forEach(b => {
    b.classList.remove('selected');
    if (b.dataset.oldText) b.innerHTML = b.dataset.oldText;
  });
}

bulles.forEach(b => {

  if (!b.dataset.detail) return;   // pas cliquable si pas de data-detail

  b.addEventListener('click', e => {
    e.stopPropagation();

    resetBulles();

    b.classList.add('selected');
    b.dataset.oldText ??= b.innerHTML;
    b.innerHTML = b.dataset.detail;
  });
});

document.addEventListener('click', resetBulles);

