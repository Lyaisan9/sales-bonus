/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const discountFactor =  1 - (purchase.discount / 100);
    const revenue =  purchase.sale_price * purchase.quantity * discountFactor;
    return revenue;
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

    // @TODO: Расчет бонуса от позиции в рейтинге

   const { profit } = seller;
   let bonusPercentage
 if (index === 0) {
    bonusPercentage = 0.15;
} else if (index <= 2 && index > 0) {
    bonusPercentage = 0.10;
} else if (index < total - 1) {
    bonusPercentage = 0.05;
} else { 
    bonusPercentage = 0;
} 
 return profit * bonusPercentage;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    if ( typeof options !== "object" || options === null ) {
         throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options ;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error ("Функции не определены")
    }
    if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error ('Некорректные опции : calculateRevenue и calculateBonus должны быть функциями ');

    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    
     const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

     const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
     const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { 
        const seller = sellerIndex[record.seller_id]; 
         if (!seller) {
        console.warn(`Продавец с id ${record.seller_id} не найден`);
        return;
          }
        seller.sales_count += 1;


        record.items.forEach(item => {
        const product = productIndex[item.sku];
        if (!product) {
                console.warn(`Товар с SKU ${item.sku} не найден`);
                return;
            }

        const cost = product.purchase_price * item.quantity;
         const revenue = options.calculateRevenue(product.sale_price, item.quantity, item.discount || 0);
          const profit = revenue - cost;

          seller.revenue += revenue;
            seller.profit += profit;

         if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

         seller.products_sold[item.sku] += item.quantity; 
          });
        });


 
    // @TODO: Сортировка продавцов по прибыли
   sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);// Считаем бонус
        
        seller.top_products =  Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);// Формируем топ-10 товаров
});
  const allProductsSold = {};
    sellerStats.forEach(seller => {
        Object.entries(seller.products_sold).forEach(([sku, qty]) => {
            allProductsSold[sku] = (allProductsSold[sku] || 0) + qty;
        });
    });
    const topProducts = Object.entries(allProductsSold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);


    // @TODO: Подготовка итоговой коллекции с нужными полями
 const mappedSellerStats = sellerStats.map(seller => ({
        seller_id:seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),
// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus:  +seller.bonus.toFixed(2) // Число с двумя знаками после точки, бонус продавца
}));
    return { sellerStats: mappedSellerStats, topProducts };
};
