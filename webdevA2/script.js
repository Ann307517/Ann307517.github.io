/*jshint esversion: 6 */

/*********************FULL SCREEN**********************/
// Check if the browser supports the Fullscreen API
if (document.documentElement.requestFullscreen) {
    // Function to enter fullscreen mode
    const enterFullscreen = function () {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari, and Opera
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    };

    // Function to exit fullscreen mode
    const exitFullscreen = function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    };

    // Add event listeners to enter/exit fullscreen on button click
    var fullscreenButton = document.getElementById('button');

    fullscreenButton.addEventListener('click', function () {
        if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    });
}


document.addEventListener('DOMContentLoaded', function () {
    /****************ACCORDION*****************/
    document.querySelectorAll('.atabs').forEach(function (tab) {
        tab.addEventListener('click', function () {
            this.classList.add('is-active');
            this.parentNode.querySelectorAll('.atabs').forEach(function (sibling) {
                if (sibling !== tab && sibling.classList.contains('is-active')) {
                    sibling.classList.remove('is-active');
                }
            });
        });
    });

    /*****************GAME*********************/
    const sections = document.querySelectorAll(".section");
    const inventoryList = document.getElementById("inventory-list");
    const inventoryDropArea = document.getElementById("inventory-drop");
    let inventory = {};

    // Define recipes with section restrictions
    const recipes = {
        "cake": { ingredients: ["flour", "sugar", "butter", "eggs"], section: "oven" },
        "cookies": { ingredients: ["flour", "sugar", "butter"], section: "oven" },
        "mochi": { ingredients: ["flour", "sugar", "milk"], section: "stove" },
        "cream-puffs": { ingredients: ["flour", "butter", "eggs"], section: "oven" },
        "tang-yuan": { ingredients: ["glutinous rice flour", "water", "sugar"], section: "stove" }
    };

    // Show sections
    document.getElementById("pantry-button").addEventListener("click", () => {
        showSection("pantry");
    });

    document.getElementById("oven-button").addEventListener("click", () => {
        showSection("oven");
    });

    document.getElementById("stove-button").addEventListener("click", () => {
        showSection("stove");
    });

    document.getElementById("mixing-bowl-button").addEventListener("click", () => {
        showSection("mixing-bowl");
    });

    // Drag and drop functionality
    document.querySelectorAll(".ingredient").forEach(ingredient => {
        ingredient.addEventListener("dragstart", dragStart);
        ingredient.addEventListener("dragend", dragEnd);
    });

    // Drop areas for sections
    document.querySelectorAll(".drop-area").forEach(area => {
        area.addEventListener("dragover", dragOver);
        area.addEventListener("drop", drop);
        area.addEventListener("dragleave", dragLeave);
    });

    // Drop area for inventory
    inventoryDropArea.addEventListener("dragover", dragOver);
    inventoryDropArea.addEventListener("drop", dropToInventory);
    inventoryDropArea.addEventListener("dragleave", dragLeave);

    // Handle "Make" button clicks
    document.getElementById("oven-make-button").addEventListener("click", () => {
        makeItem("oven");
    });

    document.getElementById("stove-make-button").addEventListener("click", () => {
        makeItem("stove");
    });

    document.getElementById("mixing-bowl-make-button").addEventListener("click", () => {
        makeItem("mixing-bowl");
    });

    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = "block";
            } else if (section.id === "inventory") {
                section.style.display = "block"; // Always show inventory
            } else {
                section.style.display = "none";
            }
        });
    }

    function dragStart(event) {
        event.dataTransfer.setData("text/plain", event.target.getAttribute("data-ingredient"));
        event.dataTransfer.effectAllowed = "move";
        event.target.classList.add("dragging");
    }

    function dragEnd(event) {
        event.target.classList.remove("dragging");
    }

    function dragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add("drag-over");
    }

    function drop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-over");
        const ingredient = event.dataTransfer.getData("text/plain");
        const sectionId = event.currentTarget.id;
        const ingredientName = ingredient.split(' ')[0]; // Get ingredient name only

        if (sectionId === "oven-drop" || sectionId === "stove-drop" || sectionId === "mixing-bowl-drop") {
            let currentContent = event.currentTarget.getAttribute('data-content') || '';
            let currentQuantities = parseQuantities(currentContent);

            if (currentQuantities[ingredientName]) {
                currentQuantities[ingredientName] += 1;
            } else {
                currentQuantities[ingredientName] = 1;
            }

            event.currentTarget.setAttribute('data-content', formatQuantities(currentQuantities));
            event.currentTarget.textContent = `Contains: ${formatQuantities(currentQuantities)}`;
            removeFromInventory(ingredientName);
        }
    }

    function dropToInventory(event) {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-over");
        const ingredient = event.dataTransfer.getData("text/plain");
        const ingredientName = ingredient.split(' ')[0]; // Get ingredient name only

        // Add item to inventory, regardless of whether it’s already there
        addToInventory(ingredientName);
    }

    function dragLeave(event) {
        event.currentTarget.classList.remove("drag-over");
    }

    function addToInventory(ingredient) {
        if (inventory[ingredient]) {
            inventory[ingredient] += 1; // Increase quantity if item already exists
        } else {
            inventory[ingredient] = 1; // Add new item
        }
        updateInventoryDisplay();
    }

    function removeFromInventory(ingredient) {
        if (inventory[ingredient]) {
            inventory[ingredient] -= 1;
            if (inventory[ingredient] <= 0) {
                delete inventory[ingredient];
            }
            updateInventoryDisplay();
        }
    }

    function updateInventoryDisplay() {
        inventoryList.innerHTML = "";
        for (const [item, quantity] of Object.entries(inventory)) {
            const li = document.createElement("li");
            li.textContent = `${item} (${quantity})`;
            li.setAttribute("data-ingredient", item);
            li.draggable = true;
            li.classList.add("ingredient");
            li.addEventListener("dragstart", dragStart);
            li.addEventListener("dragend", dragEnd);
            inventoryList.appendChild(li);
        }
    }

    function formatQuantities(quantities) {
        return Object.entries(quantities).map(([item, qty]) => `${item} (${qty})`).join(', ');
    }

    function parseQuantities(text) {
        const quantities = {};
        text.split(', ').forEach(entry => {
            const [item, qty] = entry.split(' (');
            if (qty) {
                quantities[item] = parseInt(qty.replace(')', ''), 10);
            }
        });
        return quantities;
    }

    function makeItem(sectionId) {
        const dropArea = document.getElementById(`${sectionId}-drop`);
        const content = dropArea.getAttribute('data-content') || '';
        const ingredientsInSection = parseQuantities(content);

        // Check if ingredients match any recipe and if the recipe is valid for the section
        let result = "Cannot make anything with the current ingredients.";
        dropArea.setAttribute('data-content', ''); // Clear the section
        dropArea.textContent = `Contains: ${formatQuantities({})}`; // Update the display
        let madeItem = null;
        for (const [dessert, recipe] of Object.entries(recipes)) {
            if (recipe.section === sectionId && recipe.ingredients.every(item => ingredientsInSection[item] > 0)) {
                madeItem = dessert;
                break;
            }
        }

        // Show result based on the section
        const resultArea = document.getElementById(`${sectionId}-result`);
        if (madeItem) {
            result = `Made: ${madeItem}`;
            addToInventory(madeItem); // Add the made item to the inventory
            dropArea.setAttribute('data-content', ''); // Clear the section
            dropArea.textContent = `Contains: ${formatQuantities({})}`; // Update the display
        }
        resultArea.textContent = result;
    }

    /******************POP UP BUTTON*************************/
    document.querySelectorAll('.popBtn > button').forEach(function (element) {
        element.addEventListener('click', function () {
            const index = element.getAttribute('data-index');
            const popElement = document.querySelector(`.pop[data-index="${index}"]`);
            fadeIn(popElement, 300);
        });
    });

    document.querySelectorAll('.pop > span, .pop').forEach(function (element) {
        element.addEventListener('click', function () {
            const popElement = element;
            fadeOut(popElement, 300);
        });
    });

    function fadeIn(element, duration) {
        element.style.opacity = 0;
        element.style.display = 'block';

        var last = +new Date();
        var tick = function () {
            element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
            last = +new Date();

            if (+element.style.opacity < 1) {
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(tick);
                }
                else {
                    setTimeout(tick, 16);
                }
            }
        };

        tick();
    }

    function fadeOut(element, duration) {
        element.style.opacity = 1;

        var last = +new Date();
        var tick = function () {
            element.style.opacity = +element.style.opacity - (new Date() - last) / duration;
            last = +new Date();

            if (+element.style.opacity > 0) {
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(tick);
                }
                else {
                    setTimeout(tick, 16);
                }
            } else {
                element.style.display = 'none';
            }
        };

        tick();
    }
});

/******************SEARCH BAR*************************/
const typeList = document.getElementById('typeList');
const searchBar = document.getElementById('searchBar');
let dessertTypes = [];

searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toLowerCase();

    const filteredDesserts = dessertTypes.filter((dessert) => {
        return (
            dessert.name.toLowerCase().includes(searchString) ||
            dessert.time.toLowerCase().includes(searchString)
        );
    });
    displayDesserts(filteredDesserts);
});

const loadDesserts = () => {
    // Define your list of desserts here
    dessertTypes = [
        {
            name: 'Donuts',
            time: '30 minutes',
            image: 'images/donut.jpg',
            ingredients: [
                {
                    name: 'Milk',
                    quantity: '240 ml'
                },
                {
                    name: 'Egg',
                    quantity: '1'
                },
                {
                    name: 'Sugar',
                    quantity: '30g'
                },
                {
                    name: 'Yeast',
                    quantity: '2 teaspoon'
                },
                {
                    name: 'Bread Flour',
                    quantity: '352g'
                },
                {
                    name: 'Salt',
                    quantity: '1/2 teaspoon'
                },
                {
                    name: 'Butter',
                    quantity: '2 tablespoon'
                },
                {
                    name: 'Powdered Sugar',
                    quantity: '[Optional]'
                }
            ],
            vid: 'https://www.youtube.com/embed/OS1bu8p8GZk?si=XMP-b67aM2IzmtI5'
        },
        {
            name: 'Cookies',
            time: '~60 minutes',
            image: 'images/cookie.jpg',
            ingredients: [
                {
                    name: 'Brown Sugar',
                    quantity: '100g'
                },
                {
                    name: 'White Sugar',
                    quantity: '50g'
                },
                {
                    name: 'Unsalted Butter',
                    quantity: '115g'
                },
                {
                    name: 'Large Egg',
                    quantity: '1'
                },
                {
                    name: 'Vanilla Extract',
                    quantity: '2 teaspoon'
                },
                {
                    name: 'All Purpose Flour',
                    quantity: '190g'
                },
                {
                    name: 'Baking Soda',
                    quantity: '3/4 teaspoon'
                },
                {
                    name: 'Salt',
                    quantity: '1/2 teaspoon'
                },
                {
                    name: 'Chocolate Chips',
                    quantity: '~160g'
                }
            ],
            vid: 'https://www.youtube.com/embed/PFJAuAWxuvI?si=Jqm0X8jZ-v88bmF9'
        },
        {
            name: 'Cupcakes',
            time: '30 minutes',
            image: 'images/cupcake.jpg',
            ingredients: [
                {
                    name: 'All Purpose Flour',
                    quantity: '1 1/4 cups'
                },
                {
                    name: 'Baking Powder',
                    quantity: '1 1/4 teaspoon'
                },
                {
                    name: 'Salt',
                    quantity: '1/2 teaspoon'
                },
                {
                    name: 'Unsalted butter',
                    quantity: '1/2 cup'
                },
                {
                    name: 'Sugar',
                    quantity: '3/4 cup'
                },
                {
                    name: 'Large Egg',
                    quantity: '2'
                },
                {
                    name: 'Vanilla Extract',
                    quantity: '2 teaspoon'
                },
                {
                    name: 'Buttermilk',
                    quantity: '1/2 cup'
                }
            ],
            vid: 'https://www.youtube.com/embed/Ffqe3GnNJhc?si=Z8vCDthlDdRVHcEw'
        },
        {
            name: 'Ice Cream',
            time: '5 minutes',
            image: 'images/iceCream.jpg',
            ingredients: [
                {
                    name: 'Whole Milk',
                    quantity: '1/2 cup'
                },
                {
                    name: 'Cream',
                    quantity: '1/2 cup'
                },
                {
                    name: 'Sugar',
                    quantity: '1/4 cup'
                },
                {
                    name: 'Vanilla Extract',
                    quantity: '1/2 teaspoon'
                },
                {
                    name: 'Rock Salt',
                    quantity: '1 cup'
                },
                {
                    name: 'Ice',
                    quantity: '1 Bag'
                }
            ],
            vid: 'https://www.youtube.com/embed/_Zt1EuIEhvw?si=EC5gglNPjrsy7OxP'
        },
        {
            name: 'Cake',
            time: '165 minutes',
            image: 'images/cake.jpg',
            ingredients: [
                {
                    name: 'All Purpose Flour',
                    quantity: '280g'
                },
                {
                    name: 'Baking Powder',
                    quantity: '2 1/4 teaspoon'
                },
                {
                    name: 'Salt',
                    quantity: '3/4 teaspoon'
                },
                {
                    name: 'Granulated Sugar',
                    quantity: '1 2/3 cup'
                },
                {
                    name: 'Unsalted Butter',
                    quantity: '3/4 cup'
                },
                {
                    name: 'Large Egg',
                    quantity: '3'
                },
                {
                    name: 'Vanilla Extract',
                    quantity: '1 tablespoon'
                },
                {
                    name: 'Buttermilk',
                    quantity: '1 cup'
                }
            ],
            vid: 'https://www.youtube.com/embed/EYXQmbZNhy8?si=vOii3gqwfc-vavb5'
        },
        {
            name: 'Mochi',
            time: '2 minutes',
            image: 'images/mochi.jpg',
            ingredients: [
                {
                    name: 'Glutinous Rice Flour',
                    quantity: '1/2 cup'
                },
                {
                    name: 'Granulated Sugar',
                    quantity: '1/2 cup'
                },
                {
                    name: 'Water',
                    quantity: '1/4 cup'
                }
            ],
            vid: 'https://www.youtube.com/embed/GZozm_pvLoI?si=fM0HLvlwyNtvMkfz'
        },
        {
            name: 'Pie',
            time: '120 minutes',
            image: 'images/pie.jpg',
            ingredients: [
                {
                    name: 'Double Pie Crust',
                    quantity: '1 crust'
                },
                {
                    name: 'Granny Smith Apples',
                    quantity: '7 cup'
                },
                {
                    name: 'Cinnamon',
                    quantity: '1 1/2 teaspoon'
                },
                {
                    name: 'Unsalted Butter',
                    quantity: '8 tablespoon'
                },
                {
                    name: 'All Purpose Flour',
                    quantity: '3 tablespoon'
                },
                {
                    name: 'Water',
                    quantity: '60 ml'
                },
                {
                    name: 'Granulated Sugar',
                    quantity: '200g'
                },
                {
                    name: 'Egg Wash',
                    quantity: '1 Egg + 1 tablespoon Water'
                }
            ],
            vid: 'https://www.youtube.com/embed/KbyahTnzbKA?si=0tAOCAJvAOkDqN_-'
        },
        {
            name: 'Tang Yuan',
            time: '80 minutes',
            image: 'images/tangYuan.jpg',
            ingredients: [
                {
                    name: 'Glutinous Rice Flour',
                    quantity: '250g'
                },
                {
                    name: 'Boiling Water',
                    quantity: '1/2 cup'
                }
            ],
            vid: 'https://www.youtube.com/embed/ZxB1ny8DDAU?si=bOy8C-LdIfnsZHD-'
        },
        // Add more desserts 
    ];
    displayDesserts(dessertTypes);
};

const displayDesserts = (desserts) => {
    const htmlString = desserts
        .map((dessert, index) => {
            const ingredientsList = dessert.ingredients.length > 0 ? `<ul>${dessert.ingredients.map(ingredient => `<li>${ingredient.quantity} ${ingredient.name}</li>`).join('')}</ul>` : '<p>No ingredients listed.</p>';

            return `
                <li class="dessert">
                    <h2>${dessert.name}</h2>
                    <p> ${dessert.time}</p>
                    <img src="${dessert.image}" alt="${dessert.name}">
                    <div class="popBtn"><button data-index="${index}">More Info</button></div>
                </li>
                <div class="pop" data-index="${index}">
                    <span>✖</span>
                    <h1>${dessert.name}</h1>
                    ${ingredientsList}
                    <iframe width="360" height="315" src="${dessert.vid}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                </div>
            `;
        })
        .join('');
    typeList.innerHTML = htmlString;
};

// Load the desserts without fetching from an external source
loadDesserts();

/**************************CALCULATOR****************************/
document.getElementById('open-form').addEventListener('click', function () {
    document.getElementById('popup-form').style.display = 'block';
});

document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('popup-form').style.display = 'none';
});

document.getElementById('add-ingredient').addEventListener('click', function () {
    const container = document.getElementById('ingredients-container');
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient';
    newIngredient.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Ingredient name" required>
        <input type="number" class="ingredient-amount" placeholder="Amount" required min="0.1" step="0.1">
        <input type="text" class="ingredient-unit" placeholder="Unit" required>
    `;
    container.appendChild(newIngredient);
});

document.getElementById('recipe-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const originalServings = parseInt(document.getElementById('servings').value);
    const intendedServings = parseInt(document.getElementById('intended-servings').value);

    if (originalServings <= 0 || intendedServings <= 0) {
        alert('Servings must be greater than 0');
        return;
    }

    const ingredients = document.querySelectorAll('.ingredient');
    const modifiedRecipe = document.getElementById('modified-recipe');
    modifiedRecipe.innerHTML = `<h3>${document.getElementById('recipe-name').value}</h3><ul>`;

    ingredients.forEach(function (ingredient) {
        const name = ingredient.querySelector('.ingredient-name').value;
        const amount = parseFloat(ingredient.querySelector('.ingredient-amount').value);
        const unit = ingredient.querySelector('.ingredient-unit').value;

        const newAmount = (amount / originalServings) * intendedServings;

        modifiedRecipe.innerHTML += `<li>${newAmount.toFixed(2)} ${unit} of ${name}</li>`;
    });

    modifiedRecipe.innerHTML += '</ul>';
});
