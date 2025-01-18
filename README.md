# Lego Lister

A web application that helps you find and list parts for given LEGO sets.

## Live Demo
Try it here: [Lego Lister](https://danielmroczek.github.io/lego-lister/)

## Project Origin

As a child, I was a huge LEGO fan. My brothers and I would occasionally receive LEGO sets from our parents for various occasions. All these bricks eventually ended up mixed together in one large suitcase. Twenty years later, my nephews discovered this suitcase. Being even bigger LEGO enthusiasts than I was at their age, they decided to embark on an ambitious project: finding all the original sets that my brothers and I had received in our childhood.

They took on this challenging task by first sorting all the bricks by color, then methodically trying to match them to their original sets. After many days of dedication, they succeeded! They managed to identify 40 different sets - I had no idea we had so many! However, they discovered that many sets were missing several pieces and weren't complete.

This inspired my project - to help source the missing pieces online. While similar tools existed, none provided parts lists in a clear, print-friendly format that could be easily added to a binder. That's how Lego Lister was born. Using it, I could print organized parts lists for each set, making it simple to track missing pieces and order replacements. The journey to complete these childhood sets continues!

## Features

- Search for LEGO sets by set number
- Display set information including name, theme, and year
- Show complete parts list including both regular and minifigure parts
- Responsive design
- Print-friendly layout for parts lists
- Automatic page numbering for printed documents

## Usage

1. Open the application in a web browser
2. When using for the first time, you'll be prompted to enter your Rebrickable API key
   - You can get a free API key at [Rebrickable.com](https://rebrickable.com/api/)
   - The key is stored securely in your browser's local storage
   - It's only used to communicate directly with Rebrickable's API
3. Enter a LEGO set number in the search field
4. Click "Find Set" to view the set details and parts list

Note: If your API key becomes invalid, you'll be prompted to enter a new one.

## Printing

To print a parts list:
1. Search for and display the desired set
2. Use your browser's print function (Ctrl+P or Cmd+P)
3. The list will automatically format for printing with:
   - Optimized layout for paper
   - Set information at the top of each page
   - Automatic page numbers
   - Clean, readable font sizes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
