document.addEventListener("DOMContentLoaded", () => {
    const gameCount = 10;
    const gamesContainer = document.getElementById("games");
    const predictBtn = document.getElementById("predictBtn");
    const resultDiv = document.getElementById("result");
    const avgASpan = document.getElementById("avgA");
    const avgBSpan = document.getElementById("avgB");
    const winnerSpan = document.getElementById("winner");
    const chartCanvas = document.getElementById("chart");
    let chartInstance = null; // Переменная для экземпляра графика Chart.js

    const customKeyboard = document.getElementById("custom-keyboard");
    const keyboardButtons = customKeyboard.querySelectorAll("button");

    let activeInput = null; // Переменная для отслеживания активного поля ввода

    // Создаем поля ввода для каждого гейма
    for (let i = 1; i <= gameCount; i++) {
        const div = document.createElement("div");
        div.className = "game-input";
        div.innerHTML = `
            <p><strong>Гейм ${i}</strong></p>
            <input type="text" inputmode="none" placeholder="Коэффициент A" data-player="a" data-id="${i}" maxlength="5" readonly>
            <input type="text" inputmode="none" placeholder="Коэффициент B" data-player="b" data-id="${i}" maxlength="5" readonly>
        `;
        gamesContainer.appendChild(div);
    }

    const inputs = document.querySelectorAll("input[type='text']");

    // Функция для скрытия клавиатуры
    const hideKeyboard = () => {
        customKeyboard.classList.remove("visible");
        document.body.classList.remove("keyboard-active");
        activeInput = null; // Сбрасываем активное поле
    };

    // Обработчики для полей ввода (появление клавиатуры)
    inputs.forEach((input) => {
        input.setAttribute('inputmode', 'none');
        input.setAttribute('readonly', 'readonly'); // Запрещаем ввод с системной клавиатуры

        input.addEventListener("focus", () => {
            activeInput = input;
            customKeyboard.classList.add("visible");
            document.body.classList.add("keyboard-active");
            input.select(); // Выделяем текст при фокусе
        });
        // УДАЛЕН ОБРАБОТЧИК BLUR С INPUT. МЫ БУДЕМ СКРЫВАТЬ КЛАВИАТУРУ ТОЛЬКО ПО КЛИКУ ВНЕ ЕЁ.
    });

    // Обработчик для кнопок кастомной клавиатуры
    keyboardButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            // Предотвращаем дефолтное действие (например, потерю фокуса с input)
            e.preventDefault();
            if (!activeInput) return; // Если нет активного поля, ничего не делаем

            const key = button.dataset.key;
            let currentValue = activeInput.value;

            if (key === "delete") {
                // Удаляем последний символ
                activeInput.value = currentValue.slice(0, -1);
            } else if (key === ".") {
                // Обрабатываем ввод десятичной точки/запятой
                // Разрешаем добавить запятую только один раз
                if (!currentValue.includes(',')) {
                    // Если поле пустое, начинаем с "0,"
                    // Иначе просто добавляем запятую
                    activeInput.value = currentValue.length === 0 ? "0," : currentValue + ",";
                }
            } else {
                // Вводим цифры
                // Добавляем символ, если длина не превышает maxlength
                if (currentValue.length < activeInput.maxLength) {
                    activeInput.value += key;
                }
            }

            // --- Логика форматирования и перехода к следующему полю ---
            let value = activeInput.value;

            // Убираем всё, кроме цифр и запятой
            value = value.replace(/[^0-9,]/g, "");

            // Если есть запятая
            if (value.includes(",")) {
                const parts = value.split(",");
                const before = parts[0];
                let after = parts[1] || "";

                // Если первая часть пуста, делаем "0"
                if (before === "") {
                    value = "0," + after;
                }

                // Разрешаем вводить максимум две цифры после запятой
                if (after.length > 2) {
                    after = after.slice(0, 2);
                }
                value = `${before},${after}`;
            }

            // Ограничиваем общую длину до maxlength
            if (value.length > activeInput.maxLength) {
                value = value.slice(0, activeInput.maxLength);
            }

            activeInput.value = value; // Обновляем значение поля ввода

            // Переход к следующему полю при завершении формата X,XX
            // Проверяем, что число содержит запятую и 2 знака после нее
            if (value.includes(",") && value.split(",")[1].length === 2) {
                const currentIndex = Array.from(inputs).indexOf(activeInput);
                const nextInput = inputs[currentIndex + 1];
                if (nextInput) {
                    nextInput.focus(); // Переводим фокус на следующее поле
                } else {
                    // Если это последнее поле и оно заполнено, скрываем клавиатуру
                    hideKeyboard();
                }
            }
            // --- Конец логики форматирования и перехода ---
        });
    });

    // НОВЫЙ ГЛОБАЛЬНЫЙ ОБРАБОТЧИК КЛИКОВ ДЛЯ СКРЫТИЯ КЛАВИАТУРЫ
    document.addEventListener("click", (e) => {
        // Проверяем, если клик произошел вне полей ввода и вне самой клавиатуры
        const isClickOnInput = Array.from(inputs).some(input => input.contains(e.target));
        const isClickOnKeyboard = customKeyboard.contains(e.target);
        const isClickOnPredictButton = predictBtn.contains(e.target);

        // Если клавиатура видима и клик был НЕ на поле ввода, НЕ на клавиатуре и НЕ на кнопке прогноза
        if (customKeyboard.classList.contains("visible") && !isClickOnInput && !isClickOnKeyboard && !isClickOnPredictButton) {
            hideKeyboard();
        }
    });

    // Обработчик для кнопки "Прогнозировать победителя"
    predictBtn.addEventListener("click", () => {
        const inputs = document.querySelectorAll("input[type='text']");
        let totalA = 0;
        let totalB = 0;
        let count = 0;

        inputs.forEach((input) => {
            const valueStr = input.value.replace(/,/g, ".");
            const value = parseFloat(valueStr);
            if (!isNaN(value)) {
                if (input.dataset.player === "a") {
                    totalA += value;
                } else {
                    totalB += value;
                }
                count++;
            }
        });

        if (count === 0) {
            alert("Введите хотя бы один коэффициент.");
            return;
        }

        const avgA = (totalA / count).toFixed(2);
        const avgB = (totalB / count).toFixed(2);

        let winner = "Ничья";
        if (avgA < avgB) {
            winner = "Игрок A";
        } else if (avgB < avgA) {
            winner = "Игрок B";
        }

        avgASpan.textContent = avgA;
        avgBSpan.textContent = avgB;
        winnerSpan.textContent = winner;

        resultDiv.classList.remove("hidden");
        // Скрываем клавиатуру после расчета
        hideKeyboard();
    });

    // Инициализация Chart.js (если планируется использовать)
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
});
