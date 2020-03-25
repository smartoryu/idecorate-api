module.exports = {
  getDataUser: userid => {
    return `SELECT u.id, u.name, u.username, u.email, r.role, a.label, a.receiver, a.phone, a.city, a.zip_code, a.address, u.suspend, u.verified, u.lastlogin
  FROM users u
  LEFT JOIN roles r ON u.roleid = r.id
  LEFT JOIN user_address a ON u.id = a.userid
  WHERE u.id = ${userid}`;
  },

  getCartDetails: userid => {
    return `SELECT td.transdetailsid, td.userid, p.storeid, td.productid, p.name, p.price, td.qty, p.cover_image AS image, td.position
  FROM transaction_details td LEFT JOIN products p ON td.productid = p.id
  WHERE td.userid = ${userid} AND position = 'cart'`;
  },

  getAllProduct: storeid => {
    return `SELECT p.id as productid, p.storeid, p.name, p.stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE storeid = ${storeid} ORDER BY p.id DESC`;
  },

  getProductDetails: productid => {
    return `SELECT p.id AS productid, p.storeid, p.name, (p.stock - p.sold_qty) AS stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE p.id = ${productid}`;
  },

  getCartDetails: userid => {
    return `SELECT td.transdetailsid, td.userid, p.storeid, td.productid, p.name, p.price, td.qty, p.cover_image AS image, td.position
  FROM transaction_details td LEFT JOIN products p ON td.productid = p.id
  WHERE td.userid = ${userid} AND position = 'Cart'`;
  },

  getOrderList: userid => {
    return `SELECT t.id AS transid, t.invoice, t.userid,
                (SELECT SUM(td.qty * p.price) total
                    FROM transaction_details td
                    LEFT JOIN products p ON td.productid = p.id
                    WHERE position = 'Order' AND td.transid = t.id)
                AS total_price, t.payment_receipt, t.payment_status, t.order_status
            FROM transactions t WHERE t.userid = ${userid}`;
  },

  getOrderItems: userid => {
    return `SELECT td.transdetailsid, td.transid, td.userid, p.storeid, td.productid, p.name, p.price, td.qty, p.cover_image AS image, td.position
  FROM transaction_details td LEFT JOIN products p ON td.productid = p.id
  WHERE td.userid = ${userid} AND position = 'Order'`;
  }
};
