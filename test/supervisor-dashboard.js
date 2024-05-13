// Retrieve elements
const studentList = document.querySelector('.student-list ul');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const searchInput = document.getElementById('searchInput');

// Dummy data for students and projects (replace with actual data from server)
const students = [
  { name: 'Student 1', profileUrl: 'student1_profile.html' },
  { name: 'Student 2', profileUrl: 'student2_profile.html' },
  { name: 'Student 3', profileUrl: 'student3_profile.html' },
  // Add more students as needed
];

const projects = [
  {
    title: 'Project 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    student: 'Student 1',
    comments: ['Supervisor Comment 1', 'Supervisor Comment 2']
  },
  {
    title: 'Project 2',
    description: 'Sed vehicula, ligula vel lacinia tincidunt, augue nulla pulvinar nibh, vel mattis sem magna eu tortor.',
    student: 'Student 2',
    comments: ['Supervisor Comment 3', 'Supervisor Comment 4']
  },
  // Add more projects as needed
];

// Pagination settings
const itemsPerPage = 2; // Number of items to display per page
let currentPage = 1;
let startIndex = 0;
let endIndex = itemsPerPage;

// Filtered data arrays
let filteredStudents = students;
let filteredProjects = projects;

// Function to render student list
function renderStudentList() {
  studentList.innerHTML = '';
  const studentTemplate = document.getElementById('studentTemplate');

  for (let i = startIndex; i < endIndex && i < filteredStudents.length; i++) {
    const student = filteredStudents[i];
    const listItem = studentTemplate.content.cloneNode(true);
    listItem.querySelector('a').href = student.profileUrl;
    listItem.querySelector('a').textContent = student.name;
    studentList.appendChild(listItem);
  }

  updatePaginationControls();
}

// Function to render project details
function renderProjects() {
  const projectsSection = document.querySelector('.projects');
  projectsSection.innerHTML = ''; // Clear existing content
  const projectTemplate = document.getElementById('projectTemplate');

  filteredProjects.forEach(project => {
    const projectElement = projectTemplate.content.cloneNode(true);
    projectElement.querySelector('h3').textContent = project.title;
    projectElement.querySelector('p:nth-of-type(1)').textContent = `Description: ${project.description}`;
    projectElement.querySelector('p:nth-of-type(2)').textContent = `Uploaded by: ${project.student}`;

    const commentsList = projectElement.querySelector('.comments');
    project.comments.forEach(comment => {
      const commentItem = document.createElement('li');
      commentItem.textContent = comment;
      commentsList.appendChild(commentItem);
    });

    projectsSection.appendChild(projectElement);
  });
}

// Function to update pagination controls
function updatePaginationControls() {
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = endIndex >= filteredStudents.length;
  currentPageSpan.textContent = currentPage;
}

// Event listeners for pagination
prevPageBtn.addEventListener('click', () => {
  currentPage--;
  startIndex -= itemsPerPage;
  endIndex -= itemsPerPage;
  renderStudentList();
});

nextPageBtn.addEventListener('click', () => {
  currentPage++;
  startIndex += itemsPerPage;
  endIndex += itemsPerPage;
  renderStudentList();
});

// Event listener for search input
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm)
  );
  currentPage = 1;
  startIndex = 0;
  endIndex = itemsPerPage;
  renderStudentList();
});

// Initial render of student list and project details
renderStudentList();
renderProjects();