let apiServer = "https://localhost:32774";
let userId = "2";
let userName = "wormie";
let allInventory;
let displayedCard;
let userSessionToken = '';

const login = (username, password) => {
    // Login
    const loginRequestBody = {
        username: username,
        password: password,
    };
    fetch(apiServer + "/User/Login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(loginRequestBody),
    })
        .then((response) => {
            console.log("login status", response.status);
            return response.json();
        })
        .then((data) => {
            // Handle the response data here
            userSessionToken = data.token
            console.log("login", data);
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const displayCard = async (productCode) => {
    console.log("displayCard", productCode);

    let cardDiv = document.getElementById("card");
    if (displayedCard) {
        cardDiv.innerHTML = "";
    }
    if (displayedCard === productCode) {
        displayedCard = null;
    } else {
        let productInfo = await getProductInfo(productCode);

        let set = getCardSetInfo().find(
            (obj) => obj.setCode === productInfo.setCode
        ).name;

        if (productInfo["$type"] === "Card") {
            let html =
                // `<div class="box <small>">
                `<strong>Name:</strong> ${productInfo.name}<br />
            <strong>Code:</strong> ${productInfo.code}<br />
            <strong>Set:</strong> ${set || productInfo.setCode}<br />
            <strong>Rarity:</strong> ${productInfo.rarityCode}<br />
            <strong>Side:</strong> ${productInfo.sideCode}<br />
            <strong>Type:</strong> ${productInfo.typeCode}<br />
            <strong>Text:</strong> ${productInfo.gametext}<br />
            <strong>Lore:</strong> ${productInfo.lore}<br />
            `;
            // </div>
            // `;

            cardDiv.innerHTML = html;

            displayedCard = productCode;
        }
    }
};

const getCardSetInfo = () => {
    let cardSetInfo = localStorage.getItem("cardSetInfo");

    if (cardSetInfo) {
        cardSetInfo = JSON.parse(cardSetInfo);
    } else {
        fetch(apiServer + "/CardShop/GetAllAvailableCardSetInfo")
            .then((response) => response.json())
            .then((data) => {
                console.log("card set info", data);
                cardSetInfo = data.cardSetsInfo;
                localStorage.setItem(
                    "cardSetInfo",
                    JSON.stringify(cardSetInfo)
                );
            })
            .catch((err) => {
                console.error("Error:", err);
            });
    }

    return cardSetInfo;
};

const getProductInfoFromServer = (productCode) => {
    // Get Product Info

    const productInfoRequestBody = {
        /* Your request data goes here */
    };
    return fetch(
        apiServer + "/CardShop/GetProductInfo?productCode=" + productCode,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userSessionToken}`
            },
            body: JSON.stringify(productInfoRequestBody),
        }
    )
        .then((response) => response.json())
        .then((data) => {
            // Handle the response data here
            return data;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const getProductInfoFromLocalStorage = (productCode) => {
    // Get Product Info from Local Storage
    let productInfo = localStorage.getItem(productCode);
    if (productInfo) {
        productInfo = JSON.parse(productInfo);

        return productInfo;
    } else {
        return null;
    }
};

const getProductInfo = async (productCode) => {
    // Get Product Info
    let productInfo = getProductInfoFromLocalStorage(productCode);
    if (productInfo) {
        console.log(
            "product info for",
            productCode,
            "from local storage:",
            productInfo
        );
    } else {
        productInfo = await getProductInfoFromServer(productCode);
        console.log(
            "product info for",
            productCode,
            "from server:",
            productInfo
        );
        try {
            localStorage.setItem(productCode, JSON.stringify(productInfo));
        } catch (error) {
            console.error("Error setting in localStorage:", error);
        }
    }
    return productInfo;
};

const fetchUserInventory = () => {
    // Fetch User Inventory
    const userInventoryRequestBody = {
        /* Your request data goes here */
    };
    fetch(apiServer + "/Admin/GetUserInventoryByUserId?userId=" + userId, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userSessionToken}`
        },
        body: JSON.stringify(userInventoryRequestBody),
    })
        .then((response) => response.json())
        .then(async (data) => {
            // Handle the response data here
            console.log("user inventory", data);

            const table = document.getElementById("user_inventory_table");
            let table_html = `<thead><tr><th colspan='5' class='big'>User Inventory</th></tr>
                <tr>
                <th>Product</th>
                <th>S</th>
                <th>R</th>
                <th>Qty</th>
                <th>Open</th>
                </tr></thead>`;

            for (product of data) {
                // let productData = allInventory.find(
                //     (obj) => obj.product.code === product.productCode
                // );

                let productData = await getProductInfo(product.productCode);

                if (!productData) {
                    console.log(
                        "could not find product data for",
                        product.productCode
                    );
                } else {
                    let type = productData["$type"];

                    let side = "";
                    if (productData.sideCode === "light") {
                        side = "L";
                    } else if (productData.sideCode === "dark") {
                        side = "D";
                    }

                    table_html += `<tr><td${
                        type === "Card"
                            ? ` onclick="displayCard('${productData.code.trim()}')"`
                            : ``
                    }>${productData.name}</td>
                    <td>${side}</td>
                    <td>${productData.rarityCode || ""}</td>
                    <td>${product.count}</td><td>${
                        type != "Card"
                            ? "<button onclick='openProduct(\"" +
                              productData.code +
                              "\")'>Open 1</button>"
                            : ""
                    }</td></tr>`;
                }
            }
            table.innerHTML = table_html;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const fetchAllInventory = () => {
    // Fetch All Shop Inventory
    const allInventoryRequestBody = {
        /* Your request data goes here */
    };
    fetch(apiServer + "/CardShop/GetShopInventory?includeOutOfStock=true", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(allInventoryRequestBody),
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the response data here
            console.log("all inventory", data);
            allInventory = data.inventory;
            fetchUserInventory();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const fetchUserInfo = () => {
    // Fetch User Info
    fetch(apiServer + "/CardShop/GetUser", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userSessionToken}`
        },
    })
        .then((response) => {
            console.log("user info status", response.status);
            return response.json();
        })
        .then((data) => {
            // Handle the response data here
            console.log("user info", data);

            const table = document.getElementById("user_info_table");
            let table_html =
                "<thead><tr><th colspan='2'>User Info</th></tr><tr><th>Username</th><th>Balance</th></tr></thead>";

            table_html +=
                "<tr><td>" +
                data.userName +
                "</td><td>" +
                new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "USD",
                }).format(data.balance) +
                "</td></tr>";

            table.innerHTML = table_html;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const fetchShopInventory = () => {
    // Fetch Shop Inventory
    const shopInventoryRequestBody = {
        /* Your request data goes here */
    };
    fetch(apiServer + "/CardShop/GetShopInventory", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(shopInventoryRequestBody),
    })
        .then((response) => response.json())
        .then((data) => {
            // sort data.inventory by name
            let sortedInventory = data.inventory.sort((a, b) => {
                if (a.product.name < b.product.name) {
                    return -1;
                }
                if (a.product.name > b.product.name) {
                    return 1;
                }
                return 0;
            });

            console.log("sorted store inventory", sortedInventory);
            // console.log(sortedInventory);

            // Handle the response data here
            console.log("raw store inventory", data);

            const table = document.getElementById("shop_inventory_table");
            let table_html =
                "<thead><tr><th colspan='4' class='big'><strong>Shop Inventory</strong></th></tr><tr><th>Product</th><th>Qty</th><th>Price</th><th>Buy</th></tr></thead>";
            for (product of sortedInventory) {
                table_html +=
                    "<tr><td>" +
                    product.product.name +
                    "</td><td>" +
                    product.count +
                    "</td><td>" +
                    new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                    }).format(product.product.costPer) +
                    "</td><td>" +
                    "<button onclick='buyProduct(\"" +
                    product.product.code +
                    "\")'>Buy 1</button>" +
                    "</td></tr>";
            }
            table.innerHTML = table_html;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const buyProduct = (productCode) => {
    // Buy Product
    const buyProductRequestBody = {
        purchaserId: userId,
        inventoryItems: [{ productCode: productCode, count: 1 }],
    };
    fetch(apiServer + "/CardShop/PurchaseProduct", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userSessionToken}`
        },
        body: JSON.stringify(buyProductRequestBody),
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the response data here
            console.log("buy product response", data);
            refresh();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

function openProduct(productCode) {
    // Open Product
    const openProductRequestBody = {
        userId: userId,
        inventoryProductsToOpen: [{ productCode: productCode, count: 1 }],
    };
    fetch(apiServer + "/CardShop/OpenInventoryProducts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userSessionToken}`
        },
        body: JSON.stringify(openProductRequestBody),
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the response data here
            console.log("open product response", data);
            refresh();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

const refresh = () => {
    fetchAllInventory();
    fetchUserInfo();
    fetchShopInventory();
};

const initialize = async () => {
    // Get the API server url and user id from local storage
    apiServer = localStorage.getItem("apiServer") || apiServer;
    userId = localStorage.getItem("userId") || userId;

    document.addEventListener("DOMContentLoaded", () => {
        let el = document.getElementById("api_server_url");
        el.value = apiServer;
        // Listen for changes to api_server_url
        el.addEventListener("change", (event) => {
            apiServer = event.target.value;
            localStorage.setItem("apiServer", apiServer);
            refresh();
        });

        el = document.getElementById("user_id");
        el.value = userId;
        // Listen for changes to user_id
        el.addEventListener("change", (event) => {
            userId = event.target.value;
            localStorage.setItem("userId", userId);
            refresh();
        });
    });

    getCardSetInfo();
    login(userName, "password123");

    refresh();
};
initialize();
