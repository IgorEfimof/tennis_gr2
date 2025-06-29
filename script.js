document.addEventListener("DOMContentLoaded", () => {
    const gameCount = 8; // Используем 8 геймов, как в вашем HTML
    const gamesContainer = document.getElementById("games");
    const predictBtn = document.getElementById("predictBtn"); // Возвращаем predictBtn
    const clearBtn = document.getElementById("clearBtn");
    const resultDiv = document.getElementById("result");
    const winnerSpan = document.getElementById("winner");
    const avgASpan = document.getElementById("avgA"); // Эти спаны теперь не используются в новой логике, но оставляем их
    const avgBSpan = document.getElementById("avgB"); // для соответствия HTML и если они будут нужны в будущем

    const chartCanvas = document.getElementById("chart");
    let chartInstance = null; // Переменная для экземпляра графика Chart.js

    const customKeyboard = document.getElementById("custom-keyboard");
    const keyboardButtons = customKeyboard.querySelectorAll("button");

    let activeInput = null; // Переменная для отслеживания активного поля ввода

    // Выбираем все существующие input-поля на странице
    const inputs = document.querySelectorAll("input[type='text']");

    // Функция для скрытия клавиатуры
    const hideKeyboard = () => {
        customKeyboard.classList.remove("visible");
        document.body.classList.remove("keyboard-active");
        if (activeInput) {
            activeInput.blur(); // Снимаем фокус с активного поля
        }
        activeInput = null; // Сбрасываем активное поле
    };

    // Функция для форматирования значения из строки (X,XX) в число (X.XX)
    const formatAndParseValue = (valueStr) => {
        if (!valueStr) return NaN;
        // Заменяем запятую на точку для parseFloat
        return parseFloat(valueStr.replace(/,/g, "."));
    };

    // Главная функция анализа коэффициентов
    const performAnalysis = () => {
        let winner = "Победитель не определен";
        let winnerFound = false;

        // Собираем коэффициенты только для Игрока А
        const valuesA = [];
        inputs.forEach(input => {
            if (input.dataset.player === 'a') {
                valuesA.push(formatAndParseValue(input.value));
            }
        });

        // Пары геймов для анализа (0-индексированные массивы valuesA):
        // [индекс_коэф_N, индекс_коэф_N+2, индекс_коэф_N+1, индекс_коэф_N+3]
        // Соответствует геймам: (1,3), (2,4), (3,5), (4,6), (5,7)
        const analysisPairs = [
            [0, 2, 1, 3], // Гейм 1 vs Гейм 3, проверка Гейм 2 и Гейм 4 (индексы A0, A2, A1, A3)
            [1, 3, 2, 4], // Гейм 2 vs Гейм 4, проверка Гейм 3 и Гейм 5 (индексы A1, A3, A2, A4)
            [2, 4, 3, 5], // Гейм 3 vs Гейм 5, проверка Гейм 4 и Гейм 6 (индексы A2, A4, A3, A5)
            [3, 5, 4, 6], // Гейм 4 vs Гейм 6, проверка Гейм 5 и Гейм 7 (индексы A3, A5, A4, A6)
            [4, 6, 5, 7]  // Гейм 5 vs Гейм 7, проверка Гейм 6 и Гейм 8 (индексы A4, A6, A5, A7)
        ];

        for (const [gameN_idx, gameNplus2_idx, gameNplus1_idx, gameNplus3_idx] of analysisPairs) {
            const kf_N = valuesA[gameN_idx];
            const kf_Nplus2 = valuesA[gameNplus2_idx];
            const kf_Nplus1 = valuesA[gameNplus1_idx];
            const kf_Nplus3 = valuesA[gameNplus3_idx];

            // Проверяем, что все нужные коэффициенты существуют (не NaN)
            // и что индексы не выходят за пределы массива valuesA
            if (gameNplus3_idx < valuesA.length &&
                !isNaN(kf_N) && !isNaN(kf_Nplus2) && !isNaN(kf_Nplus1) && !isNaN(kf_Nplus3)) {
                // Условие одинаковости коэффициентов (допуск +/- 0.02)
                if (Math.abs(kf_N - kf_Nplus2) <= 0.02) {
                    if (kf_Nplus3 < kf_Nplus1) {
                        winner = "Победитель — Игрок А";
                        winnerFound = true;
                        break; // Условие выполнено, выходим
                    } else if (kf_Nplus3 > kf_Nplus1) {
                        winner = "Победитель — Игрок В";
                        winnerFound = true;
                        break; // Условие выполнено, выходим
                    }
                }
            }
        }

        winnerSpan.textContent = winner;
        resultDiv.classList.remove("hidden");

        // Условие скрытия клавиатуры:
        // 1. Победитель найден ИЛИ
        // 2. Все коэффициенты Игрока А до Гейма 8 включительно заполнены
        const allRelevantAInputsFilled = Array.from(inputs)
            .filter(input => input.dataset.player === 'a' && parseInt(input.dataset.id) <= gameCount)
            .every(input => input.value !== "");

        if (winnerFound || allRelevantAInputsFilled) {
            hideKeyboard();
        }
    };


    // Обработчики для полей ввода (появление клавиатуры)
    inputs.forEach((input) => {
        // Запрещаем ввод с системной клавиатуры и автозаполнение
        input.setAttribute('inputmode', 'none');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('autocomplete', 'off');

        input.addEventListener("focus", () => {
            activeInput = input;
            customKeyboard.classList.add("visible");
            document.body.classList.add("keyboard-active");
            // Прокрутка к активному полю, если оно скрыто клавиатурой
            setTimeout(() => {
                activeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });

        // Добавляем обработчик click, чтобы принудительно вызывать focus
        input.addEventListener('click', (e) => {
            e.preventDefault(); // Предотвращаем дефолтное поведение
            input.focus();
            activeInput = input;
            customKeyboard.classList.add('visible');
            document.body.classList.add('keyboard-active');
        });
    });

    // Обработчик для кнопок кастомной клавиатуры
    keyboardButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); // Предотвращаем дефолтное действие
            if (!activeInput) return; // Если нет активного поля, ничего не делаем

            const key = button.dataset.key;
            let currentValue = activeInput.value;

            if (key === "delete") {
                // Удаляем последний символ
                activeInput.value = currentValue.slice(0, -1);
            } else if (key === ".") { // Обработка кнопки точки/запятой
                // Если нет запятой в текущем значении
                if (!currentValue.includes(',')) {
                    // Если поле пустое, ставим "0,"
                    if (currentValue.length === 0) {
                        activeInput.value = "0,";
                    } else if (currentValue.length === 1 && currentValue !== '0') {
                        // Если введена одна цифра (не 0), добавляем запятую (например, "1" -> "1,")
                        activeInput.value += ',';
                    } else if (currentValue.length === 2 && !currentValue.startsWith('0')) {
                        // Если введено две цифры (не "0x"), добавляем запятую (например, "12" -> "12,")
                        activeInput.value += ',';
                    }
                }
            } else { // Ввод цифр (0-9)
                // Проверяем, не превышает ли длина maxlength
                if (currentValue.length < activeInput.maxLength) {
                    if (currentValue.length === 0) {
                        // Если поле пустое и вводим цифру, сразу добавляем запятую после неё
                        activeInput.value = key + ',';
                    } else if (currentValue.includes(',')) {
                        const parts = currentValue.split(',');
                        // Разрешаем ввести только 2 цифры после запятой
                        if (parts[1].length < 2) {
                            activeInput.value += key;
                        }
                    } else if (currentValue.length === 1) {
                         // Если есть одна цифра (например, '1'), добавляем вторую (например, '12')
                         activeInput.value += key;
                    } else if (currentValue.length === 2) {
                        // Если две цифры (например, '12'), ищем запятую. Если нет, добавляем с запятой.
                        activeInput.value = currentValue + ',' + key;
                    }
                }
            }

            // После каждого ввода выполняем анализ
            performAnalysis();

            // Автоматический переход к следующему полю, если текущее заполнено в формате X,XX
            const value = activeInput.value;
            // Условие перехода: значение должно содержать запятую и ровно 2 цифры после нее.
            if (value.includes(',') && value.split(',')[1].length === 2) {
                const currentIndex = Array.from(inputs).indexOf(activeInput);
                const nextInput = inputs[currentIndex + 1];
                if (nextInput) {
                    nextInput.focus(); // Переводим фокус на следующее поле
                } else {
                    // Если это последнее поле, скрываем клавиатуру
                    hideKeyboard();
                }
            }
        });
    });

    // Обработчик для кнопки "Прогнозировать победителя" (функционал перенесен в performAnalysis)
    predictBtn.addEventListener("click", () => {
        performAnalysis();
    });

    // Обработчик для кнопки "Очистить данные"
    clearBtn.addEventListener("click", () => {
        inputs.forEach(input => {
            input.value = "";
        });
        resultDiv.classList.add("hidden");
        winnerSpan.textContent = "Победитель не определен"; // Сбрасываем текст победителя
        // avgASpan.textContent = '0.00'; // Сбрасываем неиспользуемые спаны
        // avgBSpan.textContent = '0.00'; // Сбрасываем неиспользуемые спаны
        hideKeyboard(); // Скрываем клавиатуру при очистке
    });

    // ГЛОБАЛЬНЫЙ ОБРАБОТЧИК КЛИКОВ ДЛЯ СКРЫТИЯ КЛАВИАТУРЫ
    document.addEventListener("click", (e) => {
        // Проверяем, если клик произошел вне полей ввода и вне самой клавиатуры
        const isClickOnInput = Array.from(inputs).some(input => input.contains(e.target));
        const isClickOnKeyboard = customKeyboard.contains(e.target);
        const isClickOnClearButton = clearBtn.contains(e.target);
        const isClickOnPredictButton = predictBtn.contains(e.target); // Включаем кнопку прогноза

        // Если клавиатура видима и клик был НЕ на поле ввода, НЕ на клавиатуре, НЕ на кнопке "Очистить" и НЕ на кнопке "Прогноз"
        if (customKeyboard.classList.contains("visible") && !isClickOnInput && !isClickOnKeyboard && !isClickOnClearButton && !isClickOnPredictButton) {
            hideKeyboard();
        }
    });

    // Инициализация Chart.js
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
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Светлые линии сетки
                        },
                        ticks: {
                            color: 'white' // Белый цвет текста меток
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Светлые линии сетки
                        },
                        ticks: {
                            color: 'white' // Белый цвет текста меток
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white' // Белый цвет текста легенды
                        }
                    }
                }
            }
        });
    }

    // Выполняем первоначальный анализ при загрузке страницы, если есть заполненные поля
    performAnalysis();
});
