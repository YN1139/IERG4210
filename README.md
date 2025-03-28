# IERG4210

**Static webpage: https://yn1139.github.io/IERG4210/** \
This is for storing the files of the project for IERG4210.  
The project, at the end, is aimed to build up a secure e-commerce website.

## Phase 1: Layout

Crete a dummy shopping website from scratch by hardcoding the basic elements. (dummy means categories and products are only for the purpose of displaying. Customers can not purchase goods at this moment.)

1. main.html

   - Home page of the shops, showing all listed products at this moment.
   - The navigation under the shop name is a brief overview of the possible pages, including:
     - Home page
     - FAQ page
     - Login page for customers\
       But now they are not avaliable.
   - A category menu is embedded, planning to make it into a collabsible later, and add more categories.

2. Shopping cart

   - The shopping cart is inside <nav> of the header, so that it can stay on the same layer with the navigation and be accessed in any pages as the header setting will not be adjusted (hopefully).
     - Hovering on it can see the shopping list, with the items, adjustable quantity, the price and a checkout button.
     - It will cover the elements behind.

3. Categories pages

   - They contains products categoried into different genres.
   - A hierarchical navigation menu is embedded: the last child (the page you are in) is in grey while the upper child/parent will be in blue so the users can know which part is redirectable.
   - The "Movie Soundtrack" category is an example of no products in stock.

4. Products
   - Users can access to the product pages by clicking the text or thumbnails, the text will change color when it is hovered.
   - A bigger thumnail, a description (tracklist), price, release date of the CD and a addCart button are shown.

Reference:

1. https://www.cdwarehouse.com.hk/ \
   Some CSS on the product list (flexbox settings) are referenced from it.
2. MDN manual (breadcrumbs, flexbox, position)
3. https://www.joshwcomeau.com/animation/css-transitions/ \
   Animation reference

Album cover art source: https://covers.musichoarders.xyz/

~~**! The shopping cart function is not working at this moment.**~~\
**! The layout is subjected to change.**

## Phase 2A:

16/2: submitted the IP address with secure firewall settings (allowing CUHK and local IP to access) \
8/3: updated the nginx configuration file for the assigned domain name

## Phase 2B:

Implemented add-product admin pannel, auto-resize also implemented through frontend (CSS) \
TODO: [Update, delect]-product

## Phase 3:

Shopping cart function implemented all over the web (updated at 0158 10/3 for fixing bugs)

- Reference mainly from tutorial 5 and debug with copilot (in UseOfAI.md)
- Event delegation reference: https://typeofnan.dev/how-to-bind-event-listeners-on-dynamically-created-elements-in-javascript/

11/3: updated breadcrumb for categories and product pages by using window local storage

- Reference: https://stackoverflow.com/questions/63215969/executing-a-click-function-after-redirecting-the-person-to-another-page

## Phase 4:

- Client-side form validation applied.
- Removed innerHTML and change all to .textcontetnt so all content is encoded with HTML encoding
- Added encodeURIComponent()
- Implemented CORS and Helmet for CSP
- CSRF and express-session applied
- Updated HTTPS, reference to IERG3800 settings
