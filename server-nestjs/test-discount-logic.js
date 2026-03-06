
function calculateDiscount(item, coupon) {
    const price = Number(item.price);
    const originalPrice = Number(item.originalPrice) > 0 ? Number(item.originalPrice) : price;
    const quantity = item.quantity;

    const subtotal = price * quantity;
    const originalSubtotal = originalPrice * quantity;

    const offerDiscount = Math.max(0, originalSubtotal - subtotal);
    let couponDiscount = 0;
    if (coupon) {
        couponDiscount = (subtotal * coupon.discountPercent) / 100;
    }
    const totalDiscount = offerDiscount + couponDiscount;
    const finalSubtotal = subtotal - couponDiscount;

    return {
        originalSubtotal,
        totalDiscount,
        finalSubtotal,
        offerDiscount,
        couponDiscount
    };
}

// Test Case 1: Offer + Coupon
const item1 = { price: 80, originalPrice: 100, quantity: 2 };
const coupon1 = { discountPercent: 10 };
const res1 = calculateDiscount(item1, coupon1);
console.log('Test 1 (Offer + Coupon):', res1);
// Expected: originalSubtotal: 200, totalDiscount: 56 (40 offer + 16 coupon), finalSubtotal: 144

// Test Case 2: Only Offer
const item2 = { price: 80, originalPrice: 100, quantity: 1 };
const res2 = calculateDiscount(item2, null);
console.log('Test 2 (Only Offer):', res2);
// Expected: originalSubtotal: 100, totalDiscount: 20, finalSubtotal: 80

// Test Case 3: Only Coupon (No Original Price)
const item3 = { price: 100, originalPrice: 0, quantity: 1 };
const coupon3 = { discountPercent: 20 };
const res3 = calculateDiscount(item3, coupon3);
console.log('Test 3 (Only Coupon):', res3);
// Expected: originalSubtotal: 100, totalDiscount: 20, finalSubtotal: 80

// Test Case 4: No Discounts
const item4 = { price: 100, originalPrice: 100, quantity: 1 };
const res4 = calculateDiscount(item4, null);
console.log('Test 4 (No Discounts):', res4);
// Expected: originalSubtotal: 100, totalDiscount: 0, finalSubtotal: 100
