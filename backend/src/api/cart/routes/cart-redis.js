module.exports = {
  routes: [
    {
      method: "GET",
      path: "/cart/redis",
      handler: "cart-redis.find",
      config: {
        auth: {
          strategies: ["api-token", "users-permissions"],
        },
      },
    },
    {
      method: "POST",
      path: "/cart/redis/add",
      handler: "cart-redis.add",
      config: {
        auth: {
          strategies: ["api-token", "users-permissions"],
        },
      },
    },
    {
      method: "DELETE",
      path: "/cart/redis/clear",
      handler: "cart-redis.clear",
      config: {
        auth: {
          strategies: ["api-token", "users-permissions"],
        },
      },
    },
  ],
};
