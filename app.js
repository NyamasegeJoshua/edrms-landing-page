const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like your HTML and CSS)
app.use(express.static(__dirname));

// Define the path to the users.json file
const userFilePath = path.join(__dirname, 'users.json');

// Function to read existing user data from the file
const readUserData = async () => {
    try {
        const existingData = await fs.readFile(userFilePath, 'utf-8');
        return JSON.parse(existingData);
    } catch (readError) {
        // If the file doesn't exist, return an empty array
        return [];
    }
};

// Function to write user data to the file
const writeUserData = async (users) => {
    await fs.writeFile(userFilePath, JSON.stringify(users, null, 2), 'utf-8');
};

// Route to handle the sign-up form submission
app.post('/add-user', async (req, res) => {
    // Extract user details from the request body
    const { firstname, lastname, email, password, organization } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object
    const newUser = {
        firstname,
        lastname,
        email,
        password: hashedPassword, // Store the hashed password
        organization,
    };

    try {
        // Read existing user data
        const users = await readUserData();

        // Check if the email already exists
        const isDuplicateEmail = users.some(user => user.email === email);
        if (isDuplicateEmail) {
            // Email already exists, redirect back to signup.html with a warning message
            return res.redirect('/signup.html?warning=Email address already registered');
        }

        // Add the new user to the array
        users.push(newUser);

        // Write the updated user data back to the file
        await writeUserData(users);

        console.log('User registered:', newUser);

        // Redirect to admin.html after successful registration
        return res.redirect('/admin.html?success=Registration successful');
    } catch (error) {
        console.error('Error registering user:', error);

        // Send a response indicating registration failure
        return res.redirect('/signup.html?error=Registration failed');
    }
});

// Route to handle login attempts
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Read existing user data
        const users = await readUserData();

        // Find the user with the provided email
        const user = users.find(user => user.email === email);

        // If the user is not found or the password is incorrect, respond with an error
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Login successful
        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        // Handle login failure, e.g., respond with an error
        return res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
