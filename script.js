const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const recentCitiesDropdown = document.getElementById("recent-cities");

const API_KEY = "8e85eb09c51a699718c346a661332615"; // Replace with your actual API key

let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

const updateDropdown = () => {
    console.log("Updating Dropdown with cities:", recentCities); // Debugging log
    if (recentCities.length > 0) {
        recentCitiesDropdown.innerHTML = `<option value="">Recently Searched Cities</option>`;
        recentCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            recentCitiesDropdown.appendChild(option);
        });
        recentCitiesDropdown.classList.remove('hidden');
    } else {
        recentCitiesDropdown.classList.add('hidden');
    }
};

const saveCityToLocalStorage = (city) => {
    if (!recentCities.includes(city)) {
        console.log("Adding city to recent searches:", city); // Debugging log
        recentCities.push(city);
        if (recentCities.length > 5) recentCities.shift(); // Keep only the last 5 cities
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateDropdown();
    } else {
        console.log("City already in recent searches:", city); // Debugging log
    }
};

const getWeatherImage = (description) => {
    description = description.toLowerCase();
    if (description.includes("clear")) return "sunny.png";
    if (description.includes("clouds")) return "cloudy.png";
    if (description.includes("rain")) return "rain.png";
    if (description.includes("snow")) return "snowy.png";
    if (description.includes("thunderstorm")) return "thunder.jpg";
    if (description.includes("drizzle")) return "drizzle.jpg";
    if (description.includes("mist") || description.includes("fog")) return "foggy.png";
    return "images/default.png"; // Fallback image
}

const createWeatherCard = (cityName, weatherItem, index) => {
    const weatherDescription = weatherItem.weather[0].description; // Weather description from API
    const customImage = getWeatherImage(weatherDescription); // Get the custom image based on description

    if(index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="${customImage}" alt="weather-icon">
                    <h6>${weatherDescription}</h6>
                </div>`;
    } else { // HTML for the 5-day forecast cards
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="${customImage}" alt="weather-icon">
                    <h6>${weatherDescription}</h6>
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>

                    
                </li>`;
    }
}


const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Get entered city coordinates (latitude, longitude, and name) from the API response
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => { // Show alert if user denied the location permission
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());



const updateWeatherData = (data) => {
    const weatherItem = data.currentWeather;
    const cityName = data.cityName;
    const forecast = data.forecast;

    // Update current weather
    currentWeatherDiv.innerHTML = createWeatherCard(cityName, weatherItem, 0);

    // Update forecast
    weatherCardsDiv.innerHTML = forecast.map((item, index) => createWeatherCard(cityName, item, index + 1)).join('');
};

const fetchWeatherData = async (city) => {
    try {
        const currentWeatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const currentWeatherData = await currentWeatherResponse.json();

        if (currentWeatherData.cod !== 200) {
            console.error("City not found:", currentWeatherData.message);
            return;
        }

        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();

        console.log("Weather Data:", currentWeatherData, forecastData); // Debugging log

        const forecast = forecastData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5); // Take 5 days forecast

        const data = {
            currentWeather: currentWeatherData,
            cityName: city,
            forecast: forecast
        };

        updateWeatherData(data);
        saveCityToLocalStorage(city);
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
};



locationButton.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            const data = await response.json();
            const city = data.name;
            fetchWeatherData(city);
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    });
});

recentCitiesDropdown.addEventListener('change', () => {
    const city = recentCitiesDropdown.value;
    if (city) {
        fetchWeatherData(city);
        recentCitiesDropdown.classList.add('hidden');
    }
});

window.addEventListener('load', updateDropdown);
