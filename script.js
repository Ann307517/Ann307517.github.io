/****************ACCORDION*****************/
document.addEventListener('DOMContentLoaded', function () {
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
});

/*****************GAME*********************/
document.addEventListener('DOMContentLoaded', () => {
    const ingredients = document.querySelectorAll('.ingredient');
    const pot = document.getElementById('pot');
    const potContentDiv = document.getElementById('pot-content');
    const spoon = document.getElementById('spoon');
    let potContent = [];
    let isStirring = false;
    let stirDistance = 0; // Initial stir distance
    const requiredStirDistance = 6000; // Increased required stirring distance
    const forceScale = .5; // Scale of spoon movement to force applied to ingredients
    let lastX, lastY;
    let velocityX = 0, velocityY = 0;
    const ingredientRadius = 20; // Approximate radius of ingredient icons

    const recipes = {
        'carrot,onion,tomato': 'Vegetable Soup',
        'onion': 'Basic Onion Soup',
        'tomato': 'Tomato Sauce',
        'carrot,tomato': 'Basic Tomato Soup'
    };

    ingredients.forEach(ingredient => {
        ingredient.addEventListener('dragstart', dragStart);
    });

    pot.addEventListener('dragover', dragOver);
    pot.addEventListener('drop', drop);

    spoon.addEventListener('mousedown', startStirring);
    document.addEventListener('mousemove', stirSpoon);
    document.addEventListener('mouseup', stopStirring);
    spoon.addEventListener('touchstart', startStirring);
    document.addEventListener('touchmove', stirSpoon);
    document.addEventListener('touchend', stopStirring);

    function dragStart(event) {
        event.dataTransfer.setData('text', event.target.id);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event) {
        event.preventDefault();
        const ingredientId = event.dataTransfer.getData('text');
        const ingredient = document.getElementById(ingredientId);
        if (!potContent.some(ing => ing.id === ingredientId)) {
            const rect = potContentDiv.getBoundingClientRect();
            const dropX = event.clientX - rect.left;
            const dropY = event.clientY - rect.top;
            potContent.push({ id: ingredientId, x: dropX, y: dropY, angle: 0 });
            addIngredientIcon(ingredientId, dropX, dropY);
        }
    }

    function addIngredientIcon(ingredientId, x, y) {
        const ingredientIcon = document.createElement('div');
        ingredientIcon.className = 'ingredient-icon';
        ingredientIcon.id = `icon-${ingredientId}`;
        ingredientIcon.textContent = document.getElementById(ingredientId).textContent.split(' ')[0]; // Only display icons
        ingredientIcon.style.left = `${x}px`;
        ingredientIcon.style.top = `${y}px`;
        potContentDiv.appendChild(ingredientIcon);
    }

    function updatePot() {
        potContentDiv.innerHTML = '';
        potContent.forEach(ingredient => {
            addIngredientIcon(ingredient.id, ingredient.x, ingredient.y);
        });
    }

    function startStirring(event) {
        isStirring = true;
        pot.classList.add('stirring');
        stirDistance = 0;
        lastX = event.clientX || event.touches[0].clientX;
        lastY = event.clientY || event.touches[0].clientY;
        velocityX = 0;
        velocityY = 0;
    }

    function stirSpoon(event) {
        if (isStirring) {
            const rect = pot.getBoundingClientRect();
            const currentX = event.clientX || event.touches[0].clientX;
            const currentY = event.clientY || event.touches[0].clientY;

            const dx = currentX - lastX;
            const dy = currentY - lastY;

            velocityX = dx;
            velocityY = dy;

            stirDistance += Math.sqrt(dx * dx + dy * dy);

            // Calculate spoon position within the pot boundaries
            const potCenterX = rect.left + rect.width / 2;
            const potCenterY = rect.top + rect.height / 2;
            const maxRadius = rect.width / 2 - 20; // Subtract spoon radius to keep it within the pot

            let spoonX = currentX - rect.left - rect.width / 2;
            let spoonY = currentY - rect.top - rect.height / 2;

            const distance = Math.sqrt(spoonX * spoonX + spoonY * spoonY);
            if (distance > maxRadius) {
                const angle = Math.atan2(spoonY, spoonX);
                spoonX = maxRadius * Math.cos(angle);
                spoonY = maxRadius * Math.sin(angle);
            }

            spoon.style.left = `${spoonX + potCenterX - rect.left}px`;
            spoon.style.top = `${spoonY + potCenterY - rect.top}px`;

            // Move ingredients
            moveIngredients(velocityX, velocityY);

            lastX = currentX;
            lastY = currentY;

            if (stirDistance >= requiredStirDistance) {
                finishStirring();
            }
        }
    }

    function moveIngredients(vx, vy) {
        const rect = potContentDiv.getBoundingClientRect();
        potContent.forEach((ingredient, index) => {
            const ingredientIcon = document.getElementById(`icon-${ingredient.id}`);
            let iconX = parseFloat(ingredient.x) || 0;
            let iconY = parseFloat(ingredient.y) || 0;
            let angle = ingredient.angle || 0;
            iconX += vx * forceScale;
            iconY += vy * forceScale;
            angle += (vx + vy) * forceScale;

            // Ensure the icons stay within the pot-content boundaries
            const maxRadius = rect.width / 2 - ingredientRadius; // Subtract icon radius to keep it within the pot-content
            const dx = iconX - rect.width / 2;
            const dy = iconY - rect.height / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > maxRadius) {
                const angle = Math.atan2(dy, dx);
                iconX = rect.width / 2 + maxRadius * Math.cos(angle);
                iconY = rect.height / 2 + maxRadius * Math.sin(angle);
            }

            // Update ingredient position and check for collisions
            ingredient.x = iconX;
            ingredient.y = iconY;
            ingredient.angle = angle;
            ingredientIcon.style.left = `${iconX}px`;
            ingredientIcon.style.top = `${iconY}px`;
            ingredientIcon.style.transform = `rotate(${angle}deg)`;

            // Check for collisions with other ingredients
            for (let i = 0; i < potContent.length; i++) {
                if (i !== index) {
                    const other = potContent[i];
                    const otherIcon = document.getElementById(`icon-${other.id}`);
                    const distX = other.x - ingredient.x;
                    const distY = other.y - ingredient.y;
                    const dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < ingredientRadius * 2) {
                        // Resolve collision by moving the ingredients apart
                        const angle = Math.atan2(distY, distX);
                        const overlap = ingredientRadius * 2 - dist;
                        const moveX = overlap * Math.cos(angle) / 2;
                        const moveY = overlap * Math.sin(angle) / 2;

                        ingredient.x -= moveX;
                        ingredient.y -= moveY;
                        other.x += moveX;
                        other.y += moveY;

                        ingredientIcon.style.left = `${ingredient.x}px`;
                        ingredientIcon.style.top = `${ingredient.y}px`;
                        otherIcon.style.left = `${other.x}px`;
                        otherIcon.style.top = `${other.y}px`;
                    }
                }
            }
        });
    }

    function stopStirring(event) {
        isStirring = false;
        pot.classList.remove('stirring');
        easeToStop();
    }

    function easeToStop() {
        const easingInterval = setInterval(() => {
            if (Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1) {
                clearInterval(easingInterval);
            } else {
                velocityX *= 0.9;
                velocityY *= 0.9;
                moveIngredients(velocityX, velocityY);
            }
        }, 50);
    }

    function finishStirring() {
        isStirring = false;
        pot.classList.remove('stirring');

        if (potContent.length === 0) {
            alert('The pot is empty! Add some ingredients first.');
            return;
        }

        const sortedIngredients = potContent.map(ingredient => ingredient.id).sort().join(',');
        const dish = recipes[sortedIngredients] || 'a mystery dish';
        alert(`You made ${dish}!`);

        resetGame();
    }

    function resetGame() {
        potContent = [];
        potContentDiv.innerHTML = '';
    }

    // Initial setup
    updatePot();
});

/*******************ANOTHER GAME************************/
document.addEventListener("DOMContentLoaded", () => {
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
            dessert.house.toLowerCase().includes(searchString)
        );
    });
    displayDesserts(filteredDesserts);
});

const loadDesserts = () => {
    // Define your list of desserts here
    dessertTypes = [
        {
            name: 'Harry Potter',
            time: 'Gryffindor',
            image: 'https://hp-api.herokuapp.com/images/harry.jpg',
            ingredients: [
                {
                    name: 'Wand core',
                    quantity: 'Phoenix feather'
                },
                {
                    name: 'Broomstick',
                    quantity: 'Firebolt'
                }
            ]
        },
        {
            name: 'Hermione Granger',
            time: 'Gryffindor',
            image: 'https://hp-api.herokuapp.com/images/hermione.jpeg',
            ingredients: [
                {
                    name: 'Wand core',
                    quantity: 'Phoenix feather'
                },
                {
                    name: 'Broomstick',
                    quantity: 'Firebolt'
                }
            ]
        },
        {
            name: 'Ron Weasley',
            time: 'Gryffindor',
            image: 'https://hp-api.herokuapp.com/images/ron.jpg',
            ingredients: [
                {
                    name: 'Wand core',
                    quantity: 'Phoenix feather'
                },
                {
                    name: 'Broomstick',
                    quantity: 'Firebolt'
                }
            ]
        },
        // Add more desserts as needed
    ];
    displayDesserts(dessertTypes);
};

const displayDesserts = (desserts) => {
    const htmlString = desserts
        .map((dessert, index) => {
            const ingredientsList = dessert.ingredients.length > 0
                ? `<ul>${dessert.ingredients.map(ingredient => `<li>${ingredient.name}: ${ingredient.quantity}</li>`).join('')}</ul>`
                : '<p>No ingredients listed.</p>';

            return `
                <li class="dessert">
                    <h2>${dessert.name}</h2>
                    <p>House: ${dessert.time}</p>
                    <img src="${dessert.image}" alt="${dessert.name}">
                    <div class="popBtn"><button data-index="${index}">More Info</button></div>
                </li>
                <div class="pop" data-index="${index}">
                    <span>✖</span>
                    <h1>${dessert.name}</h1>
                    ${ingredientsList}
                </div>
            `;
        })
        .join('');
    typeList.innerHTML = htmlString;
};

// Load the desserts without fetching from an external source
loadDesserts();

/******************POP UP BUTTON*************************/
document.addEventListener('DOMContentLoaded', function () {
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
                (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
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
                (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
            } else {
                element.style.display = 'none';
            }
        };

        tick();
    }
});