const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const http = require('http'); 
const socketIO = require('socket.io');
const session = require('express-session');
const { log, profile } = require('console');
const MySQLStore = require('express-mysql-session')(session);


const app = express();
const server = http.createServer(app); 
console.log('HTTP server created:', server);

const io = socketIO(server);
console.log('Socket.IO instance created:', io);


const sessionStore = new MySQLStore({
  /* MySQL connection options */
  host: 'localhost',
  user: 'root',
  password: 'nazeer3664',
  database: 'projectdb' 
});


app.use(session({
  secret: '3d3706b97b539f5e1750c0dbcfed4cab621f45bb7d0cf50ec75a3735241d675b',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));


app.use(express.json());

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});








// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); 
  }
});
const upload = multer({ storage });







app.post('/submit-project', upload.single('projectFile'), (req, res) => {
  // Access the uploaded file and form data
  const projectTitle = req.body.projectTitle;
  const projectFile = req.file;

  
  const projectData = {
    title: projectTitle,
    filePath: projectFile.path,
    studentId: 'your_student_id' // Replace with the actual student ID
  };

 

  res.status(200).send('Project submitted successfully');
});





// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'nazeer3664',
  database: 'projectdb',

  authSwitchHandler: function ({ pluginName, pluginData }, cb) {
    if (pluginName === 'mysql_native_password') {
      const password = 'nazeer3664'; 
      const buffer = Buffer.from(password + '\0');
      cb(null, buffer);
    } else {
      cb(new Error('Unsupported authentication plugin: ' + pluginName));
    }
  }
  
});

connection.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});




app.get('/get_username', (req, res) => {
  
  const userType = req.session.userType;

  // Define the table name based on the user's role
  let tableName;
  switch (userType) {
    case 'student':
      tableName = 'student';
      break;
    case 'supervisor':
      tableName = 'supervisor';
      break;
    case 'admin':
      tableName = 'admin';
      break;
    default:
      res.status(400).json({ error: 'Invalid user type' });
      return;
  }

  // Query the database to get the username based on the user's role
  const query = `SELECT first_name, last_name FROM ${tableName} WHERE id = ?`;
  connection.query(query, [req.session.user], (err, results) => {
    if (err) {
      console.error('Error fetching username from database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const username = results[0].first_name + ' ' + results[0].last_name;
    // Send the username as a JSON response
    res.json({ username: username });
  });
});



app.use(express.static(path.join(__dirname, 'Implementation')));





app.get('/admin-home', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-home.html'));
})


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
})


app.get('/student-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-dashboard.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'projects.html'));
});


app.get('/supervisor-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'supervisor-dashboard.html'));
});



app.get('/registeruser.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'registeruser.html'));
});

app.get('/supervisors-comments', (req, res) => {
  res.sendFile(path.join(__dirname, 'supervisors-comments.html'));
});


app.post('/upload', upload.single('projectFile'), (req, res) => {
  const { projectTitle } = req.body;
  const projectFile = req.file;

  if (!projectTitle || !projectFile) {
    return res.status(400).json({ message: 'Project title and file are required' });
  }

  
  const query = 'INSERT INTO project (project_name, filePath, student_Id) VALUES (?, ?, ?)';
  const studentId = req.session.user; // Assuming the student ID is stored in the session

  connection.query(query, [projectTitle, projectFile.path, studentId], (error, results) => {
    if (error) {
      console.error('Error uploading project:', error);
      return res.status(500).send('Internal Server Error');
    }

    
    io.emit('newProject', { projectTitle, filePath: projectFile.path, studentId });
    
    res.send('Project uploaded successfully.');
  });
});


// Serve the supervisors-comments HTML page
app.get('/correction', (req, res) => {
  res.sendFile(path.join(__dirname, 'correction.html'));
});

app.get('/repository', (req, res) => {
  res.sendFile(path.join(__dirname, 'repository.html'));
});

// API endpoint to fetch projects
app.get('/api/projects', (req, res) => {
  const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

  let query = 'SELECT project_name, filePath FROM project';
  if (searchQuery) {
      query += ` WHERE LOWER(project_name) LIKE '%${searchQuery}%'`;
  }

  connection.query(query, (error, results) => {
      if (error) {
          console.error('Error fetching projects:', error);
          return res.status(500).send('Internal Server Error');
    }
    console.log(results)
    res.json(results);
  });
});

app.use(express.static('public'));



// Supervisor connects to WebSocket
io.on('connection', (socket) => {
  console.log('Supervisor connected');
});


app.get('/login', (req, res) => {
 
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const userType = req.query.type; 

  let tableName;
  let redirectUrl; 

  switch (userType) {
    case 'admin':
      tableName = 'admin';
      redirectUrl = '/admin-home.html'; // Redirect to admin home page
      break;
    case 'student':
      tableName = 'student';
      redirectUrl = '/student-dashboard.html'; // Redirect to student dashboard
      break;
    case 'supervisor':
      tableName = 'supervisor';
      redirectUrl = '/supervisor-dashboard.html'; // Redirect to supervisor dashboard
      break;
    default:
      res.status(400).json({ message: 'Invalid user type' });
      return;
  }

  // Debugging: Log SQL query and parameters
  console.log('SQL Query:', `SELECT * FROM ${tableName} WHERE user_name = '${username}' AND password = '${password}'`);

  // Perform database query to check user credentials
  const query = `SELECT * FROM ${tableName} WHERE user_name = ? AND password = ?`;
  connection.query(query, [username, password], (error, results, fields) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Query results:', results); // Log query results

    if (results.length === 1) {
      // User authenticated
      // Send redirect URL and student username in response
      res.status(200).json({ message: 'Login successful', redirectUrl: redirectUrl, username: results[0].user_name });
    } else {
      // User not found or invalid credentials
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

// Defining the route to handle GET requests for fetching student profile data
app.get('/profile', (req, res) => {
  const query = 'SELECT * FROM student WHERE user_name = ?'; 
  

  connection.query(query, [req.session.user], (err, results) => {
    if (err) {
      console.error('Error fetching student profile:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    
    const profileData = {
      name: results[0].first_name,
      email: results[0].email,
      studentId: results[0].student_ID,
    };

       
    res.json(profileData);
    console.log(profile)
  });

});



// Route to fetch the list of projects
app.get('/get-projects-and-comments', (req, res) => {
  // Retrieve the list of projects from the database or storage mechanism
  // Example: Retrieve from a MySQL database
  const projects = [
    { id: 1, title: 'Project 1', filePath: 'path/to/file1.pdf' },
    { id: 2, title: 'Project 2', filePath: 'path/to/file2.docx' },
    { id: 3, title: 'Project 3', filePath: 'path/to/file3.zip' }
  ];

  res.json(projects);
});

// Route to handle comment submission
app.post('/submit-comment', (req, res) => {
  const { projectId, commentText } = req.body;

  // Save the comment to the database or storage mechanism
  // Example: Save to a MySQL database
  const comment = {
    projectId,
    text: commentText,
    supervisorId: 'your_supervisor_id' // Replace with the actual supervisor ID
  };


  const query = 'INSERT INTO project (project_name, project_description, student_id,) VALUES (?, ?, ?, ?)';
  connection.query(query, [title, description, studentId, req.file.path], (error, results, fields) => {
    if (error) {
      console.error('Error uploading project:', error);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send('Project uploaded successfully.');
  });




  res.status(200).send('Comment submitted successfully');
});




app.get('/Upload-project', (req, res) => {
  // Handle GET requests to /login here (if needed)
  // For example, you could render a login page
  res.sendFile(path.join(__dirname, 'Upload-project.html'));
});







// Handle file upload
app.post('/upload', upload.single('projectFile'), (req, res) => {
  const { project_name, project_description, student_id } = req.body;
  const studentId = req.query.studentId; // Assuming student ID is passed as a query parameter

  // Save project details to the database
  const query = 'INSERT INTO project (project_name, project_description, student_id,) VALUES (?, ?, ?)';
  connection.query(query, [title, description, studentId, req.file.path], (error, results, fields) => {
    if (error) {
      console.error('Error uploading project:', error);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send('Project uploaded successfully.');
  });
});

// Fetch projects for supervisors
app.get('/supervisor-projects', (req, res) => {
  const supervisorId = req.query.supervisorId; // Assuming supervisor ID is passed as a query parameter

  // Query projects from the database
  const query = 'SELECT * FROM project WHERE supervisor_id = ?';
  connection.query(query, [supervisorId], (error, results, fields) => {
    if (error) {
      console.error('Error fetching projects for supervisor:', error);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(results);
  });
});

// Add comment to project
app.post('/comment', (req, res) => {
  const { projectId, supervisorId, comment } = req.body;

  // Save comment to the database
  const query = 'INSERT INTO comments (roject_id, supervisor_id, comment_text, date) VALUES (?, ?, ?)';
  connection.query(query, [project_id, supervisor_id, comment_text, date], (error, results, fields) => {
    if (error) {
      console.error('Error adding comment:', error);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send('Comment added successfully.');
  });
});

// Fetch project details and comments for students
app.get('/student-project', (req, res) => {
  const projectId = req.query.projectId; 

  // Query project details and comments from the database
  const projectQuery = 'SELECT * FROM projects WHERE id = ?';
  const commentsQuery = 'SELECT * FROM comments WHERE project_id = ?';
  
  connection.query(projectQuery, [project_id], (error, projectResults, fields) => {
    if (error) {
      console.error('Error fetching project details:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    connection.query(commentsQuery, [project_id], (error, commentsResults, fields) => {
      if (error) {
        console.error('Error fetching comments:', error);
        res.status(500).send('Internal Server Error');
        return;
      }

      // Combine project details and comments
      const projectWithComments = {
        project: projectResults[0],
        comments: commentsResults
      };

      res.json(projectWithComments);
    });
  });
});



// User registration endpoint
app.post('/register', (req, res) => {
  const { userType, firstName, lastName, username, email, password, supervisorId } = req.body;

  // Validate user type
  if (userType === '') {
    return res.status(400).json({ error: 'Please select a user type.' });
  }

  // Prepare SQL query based on user type
  let query;
  let queryParams;
  if (userType === 'supervisor') {
    if (!supervisorId) {
      return res.status(400).json({ error: 'Supervisor ID is required.' });
    }
    query = 'INSERT INTO supervisors (first_name, last_name, user_name, email, password, supervisor_id) VALUES (?, ?, ?, ?, ?, ?)';
    queryParams = [firstName, lastName, username, email, password, supervisorId];
  } else if (userType === 'student') {
    query = 'INSERT INTO student (first_name, last_name, user_name, email, password) VALUES (?, ?, ?, ?, ?)';
    queryParams = [firstName, lastName, username, email, password];
  } else {
    return res.status(400).json({ error: 'Invalid user type.' });
  }

  // Execute the SQL query using the connection pool
  connection.query(query, queryParams, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error registering user.' });
    }

    // Send success message back to the client
    res.json({ message: 'User registered successfully.' });
  });
});








  
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});