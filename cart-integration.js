// Cookie Dojo Cart Integration
// Add this script to the main website to enable cart functionality

// Initialize cart
let cookieDojoCart = JSON.parse(localStorage.getItem('cookiedojo_cart') || '[]');

// Add item to cart function
function addToCart(name, price, description) {
    const existingItem = cookieDojoCart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cookieDojoCart.push({
            name: name,
            price: parseFloat(price),
            description: description,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cookiedojo_cart', JSON.stringify(cookieDojoCart));
    
    // Show success message
    showCartMessage(`${name} added to cart!`);
    
    // Update cart count
    updateCartCount();
    
    // Optional: Add visual feedback
    animateAddToCart();
}

// Update cart count display
function updateCartCount() {
    const totalItems = cookieDojoCart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    const cartIconEl = document.getElementById('cart-icon');
    
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    if (cartIconEl) {
        cartIconEl.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Show cart message
function showCartMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.innerHTML = `✅ ${message}`;
    messageEl.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    // Animate in
    setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// Add visual feedback for add to cart
function animateAddToCart() {
    const buttons = document.querySelectorAll('button[onclick*="addToCart"]');
    buttons.forEach(button => {
        if (button.dataset.justClicked) return;
        
        button.dataset.justClicked = 'true';
        button.style.transform = 'scale(0.95)';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.backgroundColor = '';
            delete button.dataset.justClicked;
        }, 200);
    });
}

// Go to cart function
function goToCart() {
    if (cookieDojoCart.length === 0) {
        alert('Your cart is empty! Add some items first.');
        return;
    }
    
    // Redirect to cart page
    window.location.href = 'cart.html';
}

// Add cart icon to the page (call this after page loads)
function addCartIcon() {
    // Only add if it doesn't already exist
    if (document.getElementById('cart-icon')) return;
    
    const cartIcon = document.createElement('div');
    cartIcon.id = 'cart-icon';
    cartIcon.innerHTML = `
        🛒
        <span id="cart-count" style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        ">0</span>
    `;
    cartIcon.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #D97A34;
        color: white;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        z-index: 9999;
    `;
    
    cartIcon.addEventListener('click', goToCart);
    cartIcon.addEventListener('mouseenter', () => {
        cartIcon.style.transform = 'scale(1.1)';
        cartIcon.style.backgroundColor = '#B85F1A';
    });
    cartIcon.addEventListener('mouseleave', () => {
        cartIcon.style.transform = '';
        cartIcon.style.backgroundColor = '#D97A34';
    });
    
    document.body.appendChild(cartIcon);
    
    // Update count on load
    updateCartCount();
}

// Initialize cart system when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCartIcon);
} else {
    addCartIcon();
}

// Update existing ORDER NOW buttons to ADD TO CART
function convertOrderButtons() {
    // This would update the existing ORDER NOW buttons to use addToCart instead
    // Example for Rice Crispy Pops:
    // <button onclick="addToCart('Rice Crispy Pops', 3.99, 'Individually wrapped crispy treat pops')">
    //   ADD TO CART
    // </button>
}

console.log('🍪 Cookie Dojo Cart System Loaded!');
