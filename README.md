# CHEFers - Restaurant Ordering System App
*Personal project*

API built using : Node.js, express, mongoDB and mongoose. 
[API Documentation](https://documenter.getpostman.com/view/12440006/Tz5jffsx) -*Actually written in spanish*-

CHEFers is an ordering system application to take orders for restaurants.
This app includes:

  **• Menu**   <br>
  -	Add, Update and Delete items from the menu.
 - Restricted to administrator, managers and chefs.
 - Endpoints to get today's menu and most popular dishes.
 
  **• User**    <br>
  -	Create an account, login and logout (Using passport-jwt).
 - Different roles can be assigned to the employee: waiter, chef, manager and admin. 
 - User Authorization.
 - Users can Reset and Update password.
 - View and Update user data.
 - Admin and Manager CRUD functionality to manage users.
 
 
**• Orders**    <br>
 - Process an order by adding items to the cart ( items can be deleted too).
 - Create an order by confirming it and assigning a table to it.
 - Change order status by update.
 - Chefs, managers and admins can view, update and delete orders.
 - Orders are automatically deleted after 20 days.




*Now working on server-side rendering*
