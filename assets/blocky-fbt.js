/**
© BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-fbt')) {
  customElements.define('blocky-fbt', 
    class BlockyFBT extends HTMLElement {
      constructor() {
        super();
      
        this.bundleProducts = this.querySelectorAll('.blocky-fbt-product');
        this.mediaItemImgs = this.querySelectorAll('.blocky-fbt-media-item');
        this.formElement = this.querySelector('.product-form__variants');
        this.comparePriceElements = this.querySelector('.blocky-fbt-total-compare-price');
        this.totalPriceElement = this.querySelector('.blocky-fbt-total-price');
        this.variantSelectors = this.querySelectorAll('.blocky-fbt-variant-selects')
        
        this.currencySymbol = this.dataset.currencySymbol;
        this.moneyFormat = this.dataset.moneyFormat;
        
        this.selectedVariants = {};
        this.initIds();
        
        this.variantSelectors.forEach(selectors => {
          selectors.addEventListener('change', this.updateVariant.bind(this));
        });
    
        this.querySelectorAll(".blocky-fbt-checkbox").forEach(checkbox => {
          checkbox.addEventListener("change", this.onCheckBoxClick.bind(this))
        })
      }
      
      initIds() {
        this.bundleProducts.forEach(product => {
          const data = product.querySelector(".blocky-fbt-checkbox")
          this.selectedVariants[data.dataset.idIndex] = {
            id: data.dataset.id,
            price: data.dataset.price,
            comparePrice: data.dataset.comparePrice,
            checked: data.checked
          };
    
        });
        this.updateFormIds();
      }
    
      onCheckBoxClick(event) {
        const target = event.currentTarget
        const index = target.dataset.index
    
        if (event.currentTarget.checked) {
          target.parentElement.parentElement.classList.remove("blocky-fbt-product-deselected")
          const select = target.parentElement.parentElement.querySelector('select')
          if (select) select.removeAttribute("disabled")         
          this.mediaItemImgs[index].querySelector(".blocky-fbt-media-item-container").classList.remove("blocky-fbt-media-item-disabled")
          this.selectedVariants[target.dataset.idIndex].checked = true
        } else {
          target.parentElement.parentElement.classList.add("blocky-fbt-product-deselected")
          const select = target.parentElement.parentElement.querySelector('select')
          if (select) select.setAttribute("disabled", "")      
          this.mediaItemImgs[index].querySelector(".blocky-fbt-media-item-container").classList.add("blocky-fbt-media-item-disabled")
          this.selectedVariants[target.dataset.idIndex].checked = false      
        }
        
        this.updateFormIds()
        this.updateTotalPrice()
      }
      
      updateVariant(event) {
        const values = []
        const target = event.currentTarget
        target.querySelectorAll("select").forEach(selector => { values.push( selector.value )})
        const variantName = values.join(" / ")
    
        const script = target.querySelector("script")
        const data = JSON.parse(script.textContent);
        let variant;
        for (const variantData of data) {
          if (variantData["title"] == variantName) {
            variant = variantData;
            break;
          }
        }

        const idIndex = target.dataset.idIndex
        const index = target.dataset.index
        
        this.selectedVariants[idIndex].id = `${variant["id"]}`;
        this.selectedVariants[idIndex].price = `${variant["price"]}`;
        this.selectedVariants[idIndex].comparePrice = `${variant["compare_at_price"] ?? variant["price"]}`;
    
        // Update price
        target.parentElement.parentElement.querySelector(".blocky-fbt-price").innerHTML = this.formatPrice(variant["price"])
        target.parentElement.parentElement.querySelector(".blocky-fbt-compare-price").innerHTML = variant["compare_at_price"] && variant["price"] !== variant["compare_at_price"] ? this.formatPrice(variant["compare_at_price"]) : ""
        
        if (variant["featured_image"]) {
          this.mediaItemImgs[index].querySelector("img").src = variant["featured_image"]["src"]
        }
        
        this.updateFormIds();
        this.updateTotalPrice();
      }
    
      updateFormIds() {
        if (!this.formElement) return
        const selectedProducts = [];
        for (const key in this.selectedVariants) {
            const variant = this.selectedVariants[key];
            if (variant && variant.checked) {
                const existingIndex = selectedProducts.findIndex(item => item.id === variant.id);
                if (existingIndex < 0) {
                    selectedProducts.push({ id: variant.id, quantity: 1 });
                } else {
                    selectedProducts[existingIndex].quantity += 1;
                }
            }
        }
        const newInputs = []
        for (let i = 0; i < selectedProducts.length; i++) {
          const product = selectedProducts[i]
          const productQuantity = document.createElement("input")
          productQuantity.setAttribute("type", "hidden")
          productQuantity.setAttribute("name", `items[${i}][quantity]`)
          productQuantity.setAttribute("value", product.quantity)
          const productId = document.createElement("input")
          productId.setAttribute("type", "hidden")
          productId.setAttribute("name", `items[${i}][id]`)
          productId.setAttribute("value", product.id)      
    
          newInputs.push(productQuantity)
          newInputs.push(productId)
        }
        this.formElement.replaceChildren(...newInputs)
      }
    
      updateTotalPrice() {
        const prices = [];
        const comparePrices = [];
        
        for (const key in this.selectedVariants) {
          const variant = this.selectedVariants[key];
          if (variant && variant.checked) {
            prices.push(parseInt(variant.price));
            comparePrices.push(parseInt(variant.comparePrice));
          }
        }
        
        const totalPrice = prices.reduce((acc, price) => acc + price, 0)
        const totalComparePrice = comparePrices.reduce((acc, price) => acc + price, 0);
        
        this.totalPriceElement.innerHTML = this.formatPrice(totalPrice);
        if (totalComparePrice > totalPrice) {
          this.comparePriceElements.innerHTML = this.formatPrice(totalComparePrice);
        } else {
          this.comparePriceElements.innerHTML = '';
        }
      }
    
      formatPrice(price) {
        if (typeof Shopify !== "undefined" && Shopify.formatMoney) {
          return Shopify.formatMoney(price, this.moneyFormat);
        }
        return this.currencySymbol + (price / 100).toFixed(2)
      }
    }
  )
}
