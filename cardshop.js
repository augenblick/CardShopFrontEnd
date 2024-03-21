let apiServer = "https://localhost:32774";
let userId = "1";
let allInventory;

const getProductInfo = (productId) => {
    // Get Product Info
    const productInfoRequestBody = {
        /* Your request data goes here */
    };
    return fetch(
        apiServer + "/CardShop/GetProductInfo?productCode=" + productId,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(productInfoRequestBody),
        }
    )
        .then((response) => response.json())
        .then((data) => {
            // Handle the response data here
            console.log("product info for", productId, ":", data);
            return data;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
};

const fetchUserInventory = () => {
    // Fetch User Inventory
    const userInventoryRequestBody = {
        /* Your request data goes here */
    };
    fetch(apiServer + "/Testing/GetUserInventory?userId=" + userId, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userInventoryRequestBody),
    })
        .then((response) => response.json())
        .then(async (data) => {
            // Handle the response data here
            console.log("user inventory", data);

            const table = document.getElementById("user_inventory_table");
            let table_html =
                "<thead><tr><th colspan='3' class='big'>User Inventory</th></tr><tr><th>Product</th><th>Qty</th><th>Open</th></tr></thead>";

            for (product of data) {
                // let productData = allInventory.find(
                //     (obj) => obj.product.code === product.productCode
                // );

                let productData = await getProductInfo(product.productCode);

                console.log("productData", productData);

                if (!productData) {
                    console.log(
                        "could not find product data for",
                        product.productCode,
                        "with /GetProductInfo"
                    );
                } else {
                    let type = productData["$type"];

                    table_html +=
                        "<tr><td>" +
                        productData.name +
                        "</td><td>" +
                        product.count +
                        "</td><td>" +
                        (type != "Card"
                            ? "<button onclick='openProduct(\"" +
                              productData.code +
                              "\")'>Open 1</button>"
                            : "") +
                        "</td></tr>";
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
    const userInformationRequestBody = {};
    fetch(apiServer + "/Testing/GetUser?userId=" + userId, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userInformationRequestBody),
    })
        .then((response) => response.json())
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

const buyProduct = (productId) => {
    // Buy Product
    const buyProductRequestBody = {
        purchaserId: userId,
        inventoryItems: [{ productCode: productId, count: 1 }],
    };
    fetch(apiServer + "/CardShop/PurchaseProduct", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
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

const openProduct = (productId) => {
    // Open Product
    const openProductRequestBody = {
        userId: userId,
        inventoryProductsToOpen: [{ productCode: productId, count: 1 }],
    };
    fetch(apiServer + "/CardShop/OpenInventoryProducts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
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
};

const refresh = () => {
    fetchAllInventory();
    fetchUserInfo();
    fetchShopInventory();
};

const initialize = () => {
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

    refresh();
};

initialize();
