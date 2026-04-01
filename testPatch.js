async function test() {
    const res = await fetch("http://localhost:3000/api/products/cmne4chik000c107abf4g32xm");
    const product = await res.json();
    
    // Attempting same PATCH as frontend
    const payload = {
        name: product.name,
        price: parseFloat(product.price.toString()),
        stock: parseInt(product.stock.toString()),
        alertQuantity: parseInt(product.alertQuantity.toString()),
        sku: product.sku || '',
        barcodeType: product.barcodeType || 'CODE128',
        unitId: product.unitId || '',
        brandId: product.brandId || '',
        categoryId: product.categoryId || '',
        manageStock: product.manageStock ?? true,
        description: product.description || '',
        image: product.image || '',
        brochureUrl: product.brochureUrl || '',
        supplierId: undefined, // Simulating empty Quick Buy
        purchaseCost: undefined
    };

    console.log("SENDING:", payload);

    const patchRes = await fetch("http://localhost:3000/api/products/cmne4chik000c107abf4g32xm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await patchRes.json();
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
}
test();
