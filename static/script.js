async function generateDiagonal() {
	const text = document.getElementById('textInput').value.trim().replace(/\s+/g, '+');
	const loadingDiv = document.getElementById('loading');
	const errorDiv = document.getElementById('error');
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');

	// Reset
	errorDiv.style.display = 'none';
	canvas.style.display = 'none';

	if (!text) {
		showError('Por favor, digite um texto!');
		return;
	}

	loadingDiv.style.display = 'block';

	try {
		// Usar CORS proxy para evitar problemas de CORS
		const url = `https://corsproxy.io/?${encodeURIComponent(`https://habbofont.net/font/habbo_oldschool/${text}.gif`)}`;

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = function() {
			loadingDiv.style.display = 'none';

			// Detectar caracteres individuais
			// const chars = detectCharacters(img, ctx);
			
			const chars = detectCharacters(img, ctx);
			const finalChars = injectSpaces(chars, text);


			if (chars.length === 0) {
				showError('Não foi possível detectar caracteres na imagem!');
				return;
			}

			// Criar imagem diagonal
			// createDiagonalImage(chars, canvas, ctx);
			createDiagonalImage(finalChars, canvas, ctx);
		};

		img.onerror = function() {
			loadingDiv.style.display = 'none';
			showError('Erro ao carregar a imagem. Tente outro texto.');
		};

		img.src = url;

	} catch (error) {
		loadingDiv.style.display = 'none';
		showError('Erro: ' + error.message);
	}
}

function detectCharacters(img, ctx) {
	// Canvas temporário para análise
	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = img.width;
	tempCanvas.height = img.height;
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.drawImage(img, 0, 0);

	const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;

	// Detectar colunas com pixels
	const columns = [];
	for (let x = 0; x < img.width; x++) {
		let hasPixel = false;
		for (let y = 0; y < img.height; y++) {
			const i = (y * img.width + x) * 4;
			const alpha = data[i + 3];
			if (alpha > 0) {
				hasPixel = true;
				break;
			}
		}
		columns.push(hasPixel);
	}

	// Agrupar colunas em caracteres
	const chars = [];
	let start = -1;

	for (let x = 0; x < columns.length; x++) {
		if (columns[x] && start === -1) {
			start = x;
		} else if (!columns[x] && start !== -1) {
			// Criar canvas para este caractere
			const width = x - start;
			const charCanvas = document.createElement('canvas');
			charCanvas.width = width;
			charCanvas.height = img.height;
			const charCtx = charCanvas.getContext('2d');
			charCtx.drawImage(img, start, 0, width, img.height, 0, 0, width, img.height);

			chars.push({
				canvas: charCanvas,
				width: width,
				height: img.height
			});

			start = -1;
		}
	}

	// Último caractere se termina com pixels
	if (start !== -1) {
		const width = columns.length - start;
		const charCanvas = document.createElement('canvas');
		charCanvas.width = width;
		charCanvas.height = img.height;
		const charCtx = charCanvas.getContext('2d');
		charCtx.drawImage(img, start, 0, width, img.height, 0, 0, width, img.height);

		chars.push({
			canvas: charCanvas,
			width: width,
			height: img.height
		});
	}

	return chars;
}

function injectSpaces(chars, text) {
	const SPACE_WIDTH = 28;   // você ajusta depois
	const SPACE_HEIGHT = chars[0]?.height || 20;

	let result = [];
	let charIndex = 0;

	for (const c of text) {
		if (c === '+') {
			result.push({
				canvas: null,
				width: SPACE_WIDTH,
				height: SPACE_HEIGHT,
				isSpace: true
			});
		} else {
			result.push(chars[charIndex]);
			charIndex++;
		}
	}

	return result;
}

function createDiagonalImage(chars, canvas, ctx) {
	if (chars.length === 0) return;

	const charHeight = chars[0].height;
	const horizontalOffset = -8; // Espaçamento entre caracteres
	const verticalOffset = -32; // Deslocamento diagonal

	// Calcular dimensões totais
	let totalWidth = 0, totalHeight = 0;
	chars.forEach((char, i) => {
		totalWidth += char.width + (i ? horizontalOffset : 0);
		totalHeight += i ? Math.ceil((chars[i-1].width + horizontalOffset) / 2) : char.height
	});

	// const totalHeight = charHeight + (verticalOffset * (chars.length - 1)) + 20;

	// Configurar canvas
	canvas.width = totalWidth;
	canvas.height = totalHeight;

	// Limpar canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Desenhar caracteres em diagonal
	let currentX = 0;
	let currentY = canvas.height  - chars[0].height;
	// pré-calcula posições
	const positions = chars.map(char => {
		const pos = { x: currentX, y: currentY };
		currentX += char.width + horizontalOffset;
		currentY -= Math.ceil((char.width + horizontalOffset) / 2);
		return pos;
	});

	// desenha do último para o primeiro
	for (let i = chars.length - 1; i >= 0; i--) {
		if (chars[i].isSpace) continue
		ctx.drawImage(chars[i].canvas, positions[i].x, positions[i].y);
	}

	canvas.style.display = 'block';
}

function showError(message) {
	const errorDiv = document.getElementById('error');
	errorDiv.textContent = message;
	errorDiv.style.display = 'block';
}

// Permitir Enter para gerar
document.getElementById('textInput').addEventListener('keypress', function(e) {
	if (e.key === 'Enter') {
		generateDiagonal();
	}
});

generateDiagonal();
