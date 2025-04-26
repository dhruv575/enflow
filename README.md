Enflow Technical Description

Dhruv Enflow

Project Proposal

We would like to create a product called Enflow (Enforcment Workflow)
that allows for law enforcement agencies to build, maintain, and use specific
workflows that automate tasks based off of officer's daily logs. Each depart-
ment will create workflows for specific "incidents", and then Enflow will comb
through each officer's daily logs at the end of the day, identify each activity,
classify it by incident, and then prepare any forms or email drafts relevant
to that incident.

Implemented Technical Stack

1. MongoDB + Express + React: MongoDB is used for storage of incident data, markdown templates, workflows, and user information. This is accessed through a Flask backend and presented in a React frontend.
2. Flask API: The backend is built with Python/Flask for robust API functionality.
3. OpenAI API: GPT-4o-mini is used for all natural language processing tasks:
   - Extracting activities from log texts
   - Classifying activities into appropriate workflows
   - Extracting required data from activities
   - Filling markdown templates with extracted data
4. PyTesseract: For OCR processing of PDF log files
5. Celery with Redis: For managing asynchronous tasks and background workers
6. WeasyPrint: For converting markdown templates to PDF documents
7. JWT Authentication: For secure user authentication and authorization

## Environment Variables

For security purposes, all sensitive credentials are stored in environment variables, not in the code.

1. **Backend Setup**: 
   - Navigate to the `backend` directory
   - Copy `env.example` to `.env`: `cp env.example .env`
   - Edit `.env` with your credentials for MongoDB, OpenAI, etc.
   - Alternatively, run the setup script: `python setup_env.py`

2. **Redis Configuration**:
   - The following Redis environment variables are required:
     - `REDIS_HOST`: Hostname or IP address of your Redis server
     - `REDIS_PORT`: Port number (default: 6379)
     - `REDIS_PASSWORD`: Password for authentication
   - Alternatively, set `REDIS_URL` directly as: `redis://:{password}@{host}:{port}/0`

3. **OpenAI API**:
   - `OPENAI_API_KEY`: Required for all NLP functionality
   - The application uses GPT-4o-mini model for optimal performance

4. **HuggingFace Deployment**:
   - When deploying to HuggingFace, set your environment variables in the HuggingFace Spaces secrets page
   - Do not commit sensitive information to the repository

For more details, see the [backend README](backend/README.md).

## Backend Setup

The backend is deployed on HuggingFace Spaces and available at [droov/enflow-api](https://huggingface.co/spaces/droov/enflow-api).

User Model

- email (String, unique)
- name (String)
- password (String)
- permissions (Admin, User)
- position (String)
- logs[] (Foreign Key)
- incidents[] (Foreign Key)

Department Model

- name (String)
- address (String)
- website (string)
- members[] (foreign key)
- workflows[] (foreign key)

Workflow Model

- title (String)
- description (String)
- data_requirements[] (field, description)
- markdown_template (String)
- template_name (String)


Log Model

- user (Foreign Key)
- department (Foreign Key)
- date (Date)
- log_text (String)
- incidents[] (Foreign Key)

Incident Model

- department (Foreign Key)
- user (Foreign Key)
- workflow (Foreign Key)
- description (String)
- date (Date)
- activity_text (String)
- status (String)
- filled_forms[] (URL)
- extracted_data (JSON)


Department Creation Workflow
A department will be created via a page on the website called department-
creation, accessible to anyone but locked behind a secret password (Nsdg@2314).
This will have a form that allows a user to instantiate a new department, as
well as its first member, who is going to be automatically given the admin role.

Once the department and the new user associated with that department are
created, the user should be able to log in with their email and chosen pass-
word (also to be set during the department-creation form). From here, the
user should have the option to upload a csv file with the following informa-
tion about people in their department: email, name, permissions, position.
We should autogenerate a 12 character password of letters and numbers for
each member. They should receive an email through EmailJS telling them
they have been signed up for Enflow, as well as their username and password.

Workflow Creation Pipeline
Admins can view existing workflows, delete workflows, and create new ones. Each workflow includes:
- A title and detailed description
- Data requirements: field definitions specifying what information should be extracted from logs
- A markdown template: The form template with placeholders for extracted data

The markdown-based approach allows for flexible form design while maintaining ease of use. Admins create templates with placeholders (e.g., {{field_name}}) that will be automatically filled with extracted data.

Log Upload/Incident Creation Pipeline
Members upload their daily logs as PDF files. The system processes these logs in the following steps:

1. PDF Extraction: Using PyTesseract for OCR to convert the PDF to text.
2. Activity Extraction: An LLM (GPT-4o-mini) analyzes the text and divides it into separate activities.
3. Workflow Classification: Each activity is analyzed and classified into the appropriate workflow (or marked as mundane).
4. Data Extraction: For each identified incident, required data is extracted based on the workflow's data requirements.
5. Form Generation: Markdown templates are filled with the extracted data.
6. PDF Conversion: Filled markdown is converted to PDF using WeasyPrint.

This process can run either synchronously or asynchronously using Celery task management.


Backend Development Steps

These are intended to be followed by Cursor Agent, powered by Claude Son-
net 3.7. When you are working, you should go only single step by single step.
Do not begin or setup for any of the other steps, only do exactly what you
need to. I have created a huggingface space for you to work in using an empty
Gradio template, and moved it to the "backend" folder of our project.

1. ✅ Set up the backend file and folder directory, do basic quality of life setting
    so that we will be able to work and test efficiently.
2. ✅ Set up the models for all of our document types
3. ✅ Create the routes and controllers necessary for working with the depart-
    ment model as per our pipeline descriptions above.
4. ✅ Begin by creating the basic authentication middleware and create ac-
    count/login/logout flow in terms of controllers and routes specifically
    for the User schema. Ensure that we properly setup the concept of
    Admins and Users.
5. ✅ Create the routes and controllers necessary to work with workflow model
    as per our pipeline descriptions above
6. ✅ Create the routes and controllers necessary to work with logs model as
    per our pipeline descriptions above
7. ✅ Create the routes and controllers necessary to work with incident model
    as per our pipeline descriptions above
8. ✅ Ensure that everything is wrapped in an easy to use API
9. ✅ Deploy to our HuggingFace space so that we can access it on the frontend
    we will be building

## Current Status and Environment Setup

The backend has been developed with all core functionality in place and is now deployed to HuggingFace Spaces:

- **API Endpoint**: [https://huggingface.co/spaces/droov/enflow-api](https://huggingface.co/spaces/droov/enflow-api)
- **Status**: Running

The backend includes:
- Authentication and user management with admin/user roles
- Department creation and management
- Workflow definition with data requirements and markdown templates
- Log upload and processing with OCR and LLM-based activity extraction
- Incident creation and tracking based on log activities
- Celery task management with Redis for background processing

### Important Environment Setup

For security, all credentials are stored in environment variables:

1. Create a `.env` file in the backend directory with:
   - MongoDB connection credentials
   - JWT secret
   - OpenAI API key (required for NLP functionality)
   - Redis configuration (see Redis Configuration section above)
   - Other configuration parameters

2. For HuggingFace deployment, these credentials have been added as repository secrets.

### Next Steps

- Begin frontend development according to the outlined steps
- Connect frontend to the deployed API
- Perform integration testing

Backend Considerations

While building the backend, here are the main ideas and thoughts that I
want you to keep in mind

1. Separation of Concerns: I want the code to be as broken down into
    separate files as possible, with calls as necessary. Keep different files for
    each prompt, etc.
2. Safety: Ensure that our API is built in a safe way; as this is meant to
    be used by law enforcement, we need it to be well protected
3. Backend Logging: Make sure that we have good backend logs to ensure
    that our eventual debugging process is quick.
4. Feedback: Many of our processes might take a little while; ensure that
    we are sending regular checkpointed updates to our frontend so we can
    keep users informed on where we are in the process.


Frontend Development Steps

1. Begin by setting up the file directory with all the relevant folders you
    envision us needing (data, images, components, pages, etc). Also create a 
    header, footer, and landing page. These should feel modern, similar to
    the landing pages of several modern startups, while also being made to
    appeal to police officers.
2. Develop a Login page which integrates with the backend. There should
    be no sign up page; accounts will only be able to be added by department
    admins from their dashboards. There should be an associated login but-
    ton in the header which turns into a logout button when authenticated.
    Authentication should last for a month.
3. Design a Dashboard. This dashboard should have separate tabs based
    on the users permission. The first tab you should develop, which should
    appear for everyone, is a reset password/update information tab.
4. Develop a department user management tab. This should only be acces-
    sible to admins. On this, we should see a list of all current active mem-
    bers and their permissions. On this tab, we should be able to add new
    users via CSV (provide a CSV template) or via single update through
    a popup form. We should also be able to delete any user, or promote
    them to admin status.
5. Develop a workflow viewing tab. This should be accessible to everyone.
    This should allow us to view all of our previously created workflows, but
    not to edit them in any way.
6. Develop a workflow management tab. This should be accessible to only
    admins and provide them a way to edit or delete any individual workflow.
7. Develop a workflow creation tab. This should be accessible to only
    admins and provide them a way to create new workflows based on the
    pipeline provided above. Be extremely careful and deliberate when you
    are implementing this; it will likely be the hardest part of this whole
    project.
8. Develop a log viewing tab visible to everyone. This will allow you to
    view any log updated by anyone, and also filter by things like date, as
    well as user.
9. Develop a incident viewing tab visible to everyone. This will allow you
    to view any incident derived from any log, and also filter by things like
    date, workflow, as well as user.


10. Develop a log uploading tab visible to everyone. This will allow people
    to upload a pdf log, and should then follow the pipeline described above.
    Take this part slow and careful as well; this is the second most important
    part.

Frontend Considerations

While building the frontend, here are the main ideas and thoughts that I
want you to keep in mind

1. Separation of Concerns: I want the code to be as broken down into
    separate files as possible, with calls as necessary. Keep different files for
    different components, etc
2. Safety: Ensure that our website is built in a safe way; as this is meant
    to be used by law enforcement, we need it to be well protected
3. Cleanliness: Make the frontend feel extremely professional and modern,
    using color schemes and styles relevant to law enforcement. Keep in
    mind the end user, which will be police offers.