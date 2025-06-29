document.addEventListener("DOMContentLoaded", () => {
    const gameCount = 8; // Изменил на 8, так как в HTML у вас до Гейма 8, а логика до 7-го
    const gamesContainer = document.getElementById("games");
    const clearBtn = document.getElementById("clearBtn"); // Переименовал, чтобы соответствовало HTML
    const resultDiv = document.getElementById("result");
    const winnerSpan = document.getElementById("winner");

    const customKeyboard = document.getElementById("custom-keyboard");
    const keyboardButtons = customKeyboard.querySelectorAll("button");

    let activeInput = null; // Переменная для отслеживания активного поля ввода

    // Динамическое создание полей ввода (если gameCount больше 8, нужно добавить в HTML)
    // Оставляю эту часть как была, так как в HTML у вас уже есть до 8 геймов.
    // Если вам нужно динамически создавать, то нужно сначала удалить старые game-input из HTML
    // или адаптировать эту логику. Пока оставляем как есть, исходя из HTML.
    // for (let i = 1; i <= gameCount; i++) {
    //     const div = document.createElement("div");
    //     div.className = "game-input";
    //     div.innerHTML = `
    //         <p><strong>Гейм ${i}</strong></p>
    //         <input type="text" inputmode="none" placeholder="Коэффициент A" data-player="a" data-id="${i}" maxlength="5" readonly>
    //         <input type="text" inputmode="none" placeholder="Коэффициент B" data-player="b" data-id="${i}" maxlength="5" readonly>
    //     `;
    //     gamesContainer.appendChild(div);
    // }

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

    // Функция для форматирования значения и преобразования в число
    const formatAndParseValue = (valueStr) => {
        if (!valueStr) return NaN;
        // Заменяем запятую на точку для parseFloat
        return parseFloat(valueStr.replace(/,/g, "."));
    };

    // Главная функция анализа коэффициентов
    const performAnalysis = () => {
        let winner = "Победитель не определен";
        let winnerFound = false;

        // Собираем коэффициенты игрока А
        const valuesA = [];
        inputs.forEach(input => {
            if (input.dataset.player === 'a') {
                valuesA.push(formatAndParseValue(input.value));
            }
        });

        // Пары геймов для анализа (0-индексированные): (0,2), (1,3), (2,4), (3,5), (4,6)
        // Соответствует геймам 1-3, 2-4, 3-5, 4-6, 5-7
        const analysisPairs = [
            [0, 2, 1, 3], // G1 vs G3, check G2 and G4
            [1, 3, 2, 4], // G2 vs G4, check G3 and G5
            [2, 4, 3, 5], // G3 vs G5, check G4 and G6
            [3, 5, 4, 6], // G4 vs G6, check G5 and G7
            [4, 6, 5, 7]  // G5 vs G7, check G6 and G8 (в HTML 8 геймов, поэтому до индекса 7)
        ];

        for (const [gameN_idx, gameNplus2_idx, gameNplus1_idx, gameNplus3_idx] of analysisPairs) {
            const kf_N = valuesA[gameN_idx];
            const kf_Nplus2 = valuesA[gameNplus2_idx];
            const kf_Nplus1 = valuesA[gameNplus1_idx];
            const kf_Nplus3 = valuesA[gameNplus3_idx];

            // Проверяем, что все нужные коэффициенты существуют (не NaN)
            if (!isNaN(kf_N) && !isNaN(kf_Nplus2) && !isNaN(kf_Nplus1) && !isNaN(kf_Nplus3)) {
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

        // Если победитель найден или все поля для анализа (до 7 гейма игрока А) заполнены
        const lastRelevantInputForAnalysis = inputs[9]; // Это input для Гейма 5 Игрока А (индекс 8), или Гейма 7 игрока А (индекс 12), если смотреть все поля то это input для Гейма 7 Игрока А (индекс 12)
        // У нас 8 геймов, каждый гейм это 2 инпута (А и В)
        // Гейм 1 (индекс 0,1)
        // Гейм 2 (индекс 2,3)
        // Гейм 3 (индекс 4,5)
        // Гейм 4 (индекс 6,7)
        // Гейм 5 (индекс 8,9)
        // Гейм 6 (индекс 10,11)
        // Гейм 7 (индекс 12,13)
        // Гейм 8 (индекс 14,15)
        // Для последней пары (Гейм 5 - Гейм 7) нам нужны коэффициенты игрока А в геймах 5, 7, 6, 8.
        // Это input'ы с индексами: 8 (А5), 12 (А7), 10 (А6), 14 (А8).
        // Поэтому достаточно проверить, заполнен ли последний input из этой группы, т.е. input с индексом 14.
        const lastInputForPlayerAAnalysis = inputs[14]; // Коэффициент А для Гейма 8

        if (winnerFound || (lastInputForPlayerAAnalysis && lastInputForPlayerAAnalysis.value !== "")) {
            hideKeyboard();
        }
    };


    // Обработчики для полей ввода (появление клавиатуры)
    inputs.forEach((input) => {
        input.setAttribute('inputmode', 'none');
        input.setAttribute('readonly', 'readonly'); // Запрещаем ввод с системной клавиатуры
        input.setAttribute('autocomplete', 'off'); // Отключаем автозаполнение

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
            e.preventDefault(); // Предотвращаем дефолтное поведение, чтобы не открывалась системная клавиатура
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
            } else if (key === ".") {
                // Обрабатываем ввод десятичной точки/запятой
                // Разрешаем добавить запятую только один раз
                if (!currentValue.includes(',')) {
                    // Если поле пустое или начинается с нуля и нет запятой, добавляем "0,"
                    // Иначе просто добавляем запятую
                    activeInput.value = currentValue.length === 0 || currentValue === '0' ? "0," : currentValue + ",";
                }
            } else { // Ввод цифр
                // Проверяем, не превышает ли длина maxlength
                if (currentValue.length < activeInput.maxLength) {
                    if (!currentValue.includes(',')) {
                        // Если нет запятой, и введено 2 символа (например, "10"), то следующий символ должен идти после запятой
                        if (currentValue.length === 2 && !currentValue.includes(',')) {
                            activeInput.value = currentValue + ',' + key;
                        } else {
                            activeInput.value += key;
                        }
                    } else {
                        const parts = currentValue.split(',');
                        // Разрешаем ввести только 2 цифры после запятой
                        if (parts[1].length < 2) {
                            activeInput.value += key;
                        }
                    }
                }
            }

            // После каждого ввода выполняем анализ
            performAnalysis();

            // Автоматический переход к следующему полю, если текущее заполнено в формате X,XX или X.XX
            // Используем RegExp для проверки формата 1.23 или 1,23
            const value = activeInput.value;
            const isFormatted = /^\d+(?:,\d{2})?$/.test(value) || /^\d+(?:\.\d{2})?$/.test(value);

            // Если это не точка и не удаление, и значение заполнено до 2-х знаков после запятой (или 3-х знаков без запятой, например "100")
            if (key !== "." && key !== "delete" && (value.includes(',') && value.split(',')[1].length === 2 || !value.includes(',') && value.length === 3)) {
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

    // Обработчик для кнопки "Очистить данные"
    clearBtn.addEventListener("click", () => {
        inputs.forEach(input => {
            input.value = "";
        });
        resultDiv.classList.add("hidden");
        winnerSpan.textContent = "Победитель не определен"; // Сброс текста победителя
        hideKeyboard();
    });

    // ГЛОБАЛЬНЫЙ ОБРАБОТЧИК КЛИКОВ ДЛЯ СКРЫТИЯ КЛАВИАТУРЫ
    document.addEventListener("click", (e) => {
        // Проверяем, если клик произошел вне полей ввода и вне самой клавиатуры
        const isClickOnInput = Array.from(inputs).some(input => input.contains(e.target));
        const isClickOnKeyboard = customKeyboard.contains(e.target);
        const isClickOnClearButton = clearBtn.contains(e.target); // Учитываем кнопку "Очистить"

        // Если клавиатура видима и клик был НЕ на поле ввода, НЕ на клавиатуре и НЕ на кнопке "Очистить"
        if (customKeyboard.classList.contains("visible") && !isClickOnInput && !isClickOnKeyboard && !isClickOnClearButton) {
            hideKeyboard();
        }
    });

    // Первоначальный анализ при загрузке страницы (если есть сохраненные данные)
    performAnalysis();
});
