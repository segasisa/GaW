const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.canvas.width  = canvas.clientWidth;
ctx.canvas.height = canvas.clientHeight;

// Параметры

const MAP_SIZE = 100;
const CELL_SIZE = 35;

const MAX_SCALE = 3;
const MIN_SCALE = 0.5;

// Подсветка номера клеток
const DEBUG_MODE = true;
// Рисование сетки
const DRAW_GRID = true;
// Убрать сетку при масштабе 
const NOT_DRAW_GRID_SCALE = 0.6;

// Получение координаты x после преобразований
function getX(coord) {
    return getScaled(coord) + (dragPosition.x * scale);
}

// Получение координаты y после преобразований
function getY(coord) {
    return getScaled(coord) + (dragPosition.y * scale);
}

// Применение масштаба на число
function getScaled(number) {
    return (number * scale);
}

function getVirtualCoords(x, y) {
    return { x: x * CELL_SIZE, y: y * CELL_SIZE }
}


// Перемещение и масштабирование карты

let dragPosition = { x: 0, y: 0 };
let startDragPosition = null;
let minScaleLimit = ctx.canvas.width / (CELL_SIZE * MAP_SIZE);

let scale = Math.max(minScaleLimit, 1);

const MIN_DRAG_POSITION = { x: 0, y: 0 };
const MAX_DRAG_POSITION = { x: CELL_SIZE * MAP_SIZE, y: CELL_SIZE * MAP_SIZE };
let dragInMomentPosition = null;

let isDragging = false;


// При зажатии на колесико мыши начать перемещать 
document.addEventListener("mousedown", (e) => {
    if ((e.button === 1) && (e.target.id === "game")) {
        document.querySelector("body").style.cursor = "grabbing";
        isDragging = true;
    }
})

// При зажатии на колесико мыши перестать перемещать
document.addEventListener("mouseup", (e) => {
    if (e.button === 1) {
        document.querySelector("body").style.cursor = "auto";
        isDragging = false;
        startDragPosition = null;
        dragInMomentPosition = null;
    }
})

// Записывать новые данные о позиции карты
document.addEventListener("mousemove", (e) => {
    // если перемещаем
    if (isDragging) {
        // Записываем начальные координаты перемещений
        if (!startDragPosition) startDragPosition = { x: e.clientX, y: e.clientY };
        if (!dragInMomentPosition) dragInMomentPosition = { ...dragPosition };

        // Устанавливаем нвоые координаты
        dragPosition.x = Math.max(Math.min(Math.floor(dragInMomentPosition.x + (e.clientX - startDragPosition.x) / scale), 0), -(MAX_DRAG_POSITION.x - ctx.canvas.width/scale));
        dragPosition.y = Math.max(Math.min(Math.floor(dragInMomentPosition.y + (e.clientY - startDragPosition.y) / scale), 0), -(MAX_DRAG_POSITION.y - ctx.canvas.height/scale));

        // Рисуем сцену
        drawScene();
    }
})

// При прокрутке колесика мыши
document.addEventListener("wheel", (e) => {
    // Если крутится вниз увеличить масштаб
    if (e.deltaY < 0) {
        if (scale >= MAX_SCALE) {
            scale = MAX_SCALE;
        } else {
            scale += 0.1;
        }
        // Если крутится вверх уменьшить масштаб
    } else if (e.deltaY > 0) {
        if (scale <= Math.max(MIN_SCALE, minScaleLimit)) {
            scale = Math.max(MIN_SCALE, minScaleLimit);
        } else {
            scale -= 0.1;
        }
    }

    // Рисуем сцену
    drawScene();
})

// Установить позицию камеры
function setDragPosition({ x, y }) {
    dragPosition = { x: -x, y: -y };
    console.log({ x: -x, y: -y })
    drawScene();
}

drawScene();


// При изменении размеров экрана перерисовывать кадр
window.addEventListener('resize', () => {
    ctx.canvas.width  = canvas.clientWidth;
    ctx.canvas.height = canvas.clientHeight;
    drawScene();
});


// Функции отрисовки

// Рисование сетки
function drawGrid() {
    if (!DRAW_GRID && !DEBUG_MODE) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.save();
    ctx.fillStyle = "#999";
    let fontSize = getScaled(20)
    ctx.font = fontSize + "px serif";
    ctx.textAlign = "center";
    for (let x = scale * (dragPosition.x - CELL_SIZE * Math.floor(dragPosition.x / CELL_SIZE)); x < canvas.width; x += CELL_SIZE * scale) {
        if (DRAW_GRID && scale > NOT_DRAW_GRID_SCALE) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }

        // Отрисовка номеров клеток
        if (DEBUG_MODE) {
            let cell_number = Math.round(((x / scale) - dragPosition.x) / CELL_SIZE);
            ctx.fillText(cell_number, x + CELL_SIZE * scale / 2, CELL_SIZE * scale / 2 + 5 * scale);
        }
    }
    for (let y = scale * (dragPosition.y - CELL_SIZE * Math.floor(dragPosition.y / CELL_SIZE)); y < canvas.height; y += CELL_SIZE * scale) {
        if (DRAW_GRID && scale > NOT_DRAW_GRID_SCALE) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }

        // Отрисовка номеров клеток
        if (DEBUG_MODE) {
            let cell_number = Math.round(((y / scale) - dragPosition.y) / CELL_SIZE); 
            ctx.fillText(cell_number, CELL_SIZE * scale / 2, y + CELL_SIZE * scale / 2 + 5 * scale);
        }
    }
    ctx.strokeStyle = "#ccc";
    ctx.stroke();
    ctx.restore();
}

// Рисование сцены
function drawScene() {
    drawGrid();
    drawBorder([
        getVirtualCoords(1, 1),
        getVirtualCoords(1, 5),
        getVirtualCoords(4, 5),
        getVirtualCoords(4, 7),
        getVirtualCoords(7, 7),
        getVirtualCoords(7, 1)
    ])
}

// Рисование границы

function drawBorder(borderEdges) {
    ctx.save();
    ctx.strokeStyle = "#000"
    ctx.beginPath();

    if ((getX(Math.max(...borderEdges.map((coords) => coords.x))) < 0) ||
        (getY(Math.max(...borderEdges.map((coords) => coords.y))) < 0)) return;
    for (let i = 0; i < borderEdges.length; i++) {
        let { x: x1, y: y1 } = borderEdges[i];
        let { x: x2, y: y2 } = borderEdges[i !== borderEdges.length - 1 ? i + 1 : 0];
        ctx.moveTo(getX(x1), getY(y1));
        ctx.lineTo(getX(x2), getY(y2));
    }
    ctx.stroke();
    ctx.restore();
}