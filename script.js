// тут все переменные
const form = document.getElementById("inputField");
const BaseAPIUrl = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
const apiKey = "C762GHQCU2TWHZFGH5P9ZGA8U";
const cityinput = document.getElementById("city-input");
import { weatherDescriptions } from "./weatherdescriptions.js";

// функция запроса города
function getWeather(city) {
    fetch(`${BaseAPIUrl}${city}?key=${apiKey}&contentType=json`)
        .then(response => response.json())
        .then(data => {
            // обработка данных
            const currentWeather = data.currentConditions;
            const temperatureF = currentWeather.temp;
            const temperatureC = (temperatureF - 32) * 5 / 9;
            const humidity = currentWeather.humidity;
            const icon = currentWeather.icon;
            const iconPath = `./icons/${icon}.png`;
            const adress = data.resolvedAddress;
            const descriptionKeys = currentWeather.conditions
            .toLowerCase()
            .split(', ') // Разбиваем строку на части по запятой и пробелу
            .map(key => key.replace(/\s+/g, '-')); // Меняем пробелы на "-"
        
        const descriptions = descriptionKeys
            .map(key => weatherDescriptions[key] || key) // Берём описание, если есть, иначе оставляем ключ
            .join(' ');
        
        const description = descriptions || "Weather data unavailable.";
            console.log(data);
            console.log(iconPath);
            // отображение данных

            const currentWeatherDiv = document.getElementById("currentWeather");
            currentWeatherDiv.style.display = 'flex';

            currentWeatherDiv.innerHTML = `
                <h2>Weather in ${adress} today</h2>
                <p>Temperature: ${temperatureC.toFixed(1)}°C</p>
                <p style="font-family: 'Times New Roman', Times; font-size: 20px; font-style: italic">${description}</p>
                <p>Humidity: ${humidity}%</p>
                <img src= "${iconPath}" width="100" height="100" alt="${icon}">
            `;

            // отображение карты
            const lat = data.latitude;
            const lon = data.longitude;
            initMap(lat, lon);

            // отображение погоды на 10 дней
            const forecastContainer = document.getElementById("forecast-container");
            forecastContainer.innerHTML = "";

            data.days.slice(0, 10).forEach(day => {
                const dayIconPath = `./icons/${day.icon}.png`;
                const dayCard = document.createElement("div");
                dayCard.className = "forecast-card";
                dayCard.innerHTML = `
                    <p>${new Date(day.datetime).toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <img src="${dayIconPath}" alt="${day.icon}">
                    <p>${((day.tempmin - 32) * 5 / 9).toFixed(1)}°C / ${((day.tempmax - 32) * 5 / 9).toFixed(1)}°C</p>
                `;
                forecastContainer.appendChild(dayCard);

                // отображение погоды по часам
dayCard.addEventListener("click", () => {
    const currentWeatherDiv = document.getElementById("currentWeather");
    const hourlyTempDiv = document.getElementById("hourly-temperature");
    const hourlyHeader = document.getElementById("hourly-header");
    hourlyTempDiv.innerHTML = "";
 
    const selectedDate = new Date(day.datetime);
    const formattedDate = selectedDate.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long' });

    //убрать выделение всех карточек
    document.querySelectorAll(".forecast-card").forEach(card => {
        card.classList.remove("selected");
    });

    // выделить выбранную карточку
    dayCard.classList.add("selected");

    // Показать заголовок и блок с часами
    hourlyHeader.textContent = `Hourly Forecast for ${formattedDate}`;
    hourlyHeader.style.display = "none";
    document.getElementById("hours").style.display = "block";

    // скрыть текущую погоду
    currentWeatherDiv.style.display = "none";

    // Получить текущее время
    const now = new Date();

    // Фильтруем часы только для выбранного дня
    const selectedDayDate = new Date(day.datetime).setHours(0, 0, 0, 0); // начало дня
    const hoursForDay = day.hours.filter(hour => {
        const hourDate = new Date(hour.datetimeEpoch * 1000).setHours(0, 0, 0, 0);
        return hourDate === selectedDayDate;
    });

    // Сортируем часы по времени, если они не в порядке
    const sortedHours = hoursForDay.sort((a, b) => a.datetimeEpoch - b.datetimeEpoch);

    // Отображаем почасовую погоду
    sortedHours.forEach(hour => {
        const hourDiv = document.createElement("div");
        hourDiv.className = "hourly-temp";

        // Формируем время
        const hourTime = new Date(hour.datetimeEpoch * 1000);
        const hourTimeFormatted = hourTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Формат времени (локальное для города)
        const localTime = new Date(hour.datetimeEpoch * 1000 + data.tzoffset * 3600000); // добавляем смещение
        
        const localTimeFormatted = localTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Температура
        const hourTempC = (hour.temp - 32) * 5 / 9;

        // Проверка прошедшего времени
        if (hourTime.getTime() < now.getTime()) {
            hourDiv.classList.add("gray");
        }

        // Заполняем данные
        hourDiv.innerHTML = `${hourTimeFormatted} : ${hourTempC.toFixed(1)}°C`;
        hourlyTempDiv.appendChild(hourDiv);
    });
});
            });
        })
        .catch(error => {
            // обработка ошибок
            console.error("Error fetching weather data:", error);
        });
}
// обработка ввода города
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = cityinput.value.trim();

    const hourlyTempDiv = document.getElementById("hourly-temperature");
    const hourlyHeader = document.getElementById("hourly-header");
    hourlyTempDiv.innerHTML = "";
    hourlyHeader.style.display = "none";
    document.getElementById("hours").style.display = "none";

    if (query) {
        getWeather(query);
    }
});
let map;
let marker;

function initMap(lat, lon) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        
        marker = L.marker([lat, lon]).addTo(map);

        // Добавляем обработчик клика по карте
        map.on('click', function (e) {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);  // Перемещаем маркер
            getCityFromCoords(lat, lng);   // Ищем город по координатам
        });

    } else {
        map.setView([lat, lon], 10);
        marker.setLatLng([lat, lon]);
    }
}
function getCityFromCoords(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.address && data.address.city) {
                const city = data.address.city;
                cityinput.value = city; // Вставляем город в поле ввода
                getWeather(city);       // Запрашиваем погоду
            } else {
                alert("Город не найден, попробуйте в другом месте!");
            }
        })
        .catch(error => console.error("Ошибка при определении города:", error));
}