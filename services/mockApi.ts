import { User, Course, Feedback, Role } from '../types';

// In-memory "database"
let users: User[] = [];
let courses: Course[] = [];
let feedbacks: Feedback[] = [];

const createInitialData = () => {
    // Admin User
    users.push({
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@1234!',
        role: Role.ADMIN,
        isBlocked: false,
        createdAt: new Date(),
        profilePicture: 'https://picsum.photos/seed/admin/200'
    });

    // Student User
    users.push({
        id: 'user-2',
        name: 'Student User',
        email: 'student@example.com',
        password: 'Student@1234!',
        role: Role.STUDENT,
        isBlocked: false,
        createdAt: new Date(),
        phoneNumber: '123-456-7890',
        dateOfBirth: '2000-01-01',
        address: '123 University Ave',
        profilePicture: 'https://picsum.photos/seed/student/200'
    });

    // Additional Students
    for(let i = 3; i <= 22; i++) {
         users.push({
            id: `user-${i}`,
            name: `Test Student ${i-2}`,
            email: `student${i-2}@example.com`,
            password: 'Password@123!',
            role: Role.STUDENT,
            isBlocked: i % 4 === 0,
            createdAt: new Date(Date.now() - (i * 1000 * 3600 * 24)),
        });
    }

    // Courses
    const courseData = [
        { name: 'Introduction to React', seed: 'react', link: 'https://www.youtube.com/watch?v=bMknfKXIFA8' },
        { name: 'Advanced TypeScript', seed: 'typescript', link: 'https://www.youtube.com/watch?v=gp5H0Lw_g_4' },
        { name: 'UI/UX Design Principles', seed: 'uiux', link: 'https://www.youtube.com/watch?v=cKsu3K8aC2g' },
        { name: 'Backend with Node.js', seed: 'nodejs', link: 'https://www.youtube.com/watch?v=f2EqECiTBL8' },
        { name: 'Database Management (SQL)', seed: 'database', link: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
        { name: 'Python for Beginners', seed: 'python', link: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
        { name: 'Machine Learning Fundamentals', seed: 'ml', link: 'https://www.youtube.com/watch?v=i_LwzRVP7bg' },
        { name: 'DevOps Crash Course', seed: 'devops', link: 'https://www.youtube.com/watch?v=JothAEQoIIo' },
        { name: 'Introduction to Docker', seed: 'docker', link: 'https://www.youtube.com/watch?v=p28piYY_j7Y' },
        { name: 'Cybersecurity Basics', seed: 'cyber', link: 'https://www.youtube.com/watch?v=inWWhr5tnEA' }
    ];
    courseData.forEach((course, i) => {
        courses.push({
            id: `course-${i+1}`,
            name: course.name,
            description: `A comprehensive course on ${course.name}.`,
            link: course.link,
            thumbnail: `https://picsum.photos/seed/${course.seed}/400/200`,
            createdAt: new Date(),
        });
    });

    // Feedbacks
    for(let i = 2; i <= 22; i++) { // Student users
        for (let j = 1; j <= 5; j++) {
            const course = courses[Math.floor(Math.random() * courses.length)];
            const rating = Math.floor(Math.random() * 5) + 1;
            feedbacks.push({
                id: `feedback-${(i-2)*5 + j}`,
                studentId: `user-${i}`,
                studentName: users.find(u => u.id === `user-${i}`)?.name || 'Unknown Student',
                courseId: course.id,
                rating,
                message: `This was a ${rating > 3 ? 'great' : 'decent'} course. The content on ${course.name} was very insightful.`,
                createdAt: new Date(Date.now() - (j * 1000 * 3600 * 24 * 7)),
            })
        }
    }
};

createInitialData();

// Helper to simulate network delay
const delay = <T,>(data: T, ms = 500): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), ms));

// Paginated response helper
const paginate = <T,>(items: T[], page: number, limit: number): { data: T[], total: number, totalPages: number } => {
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const data = items.slice((page - 1) * limit, page * limit);
    return { data, total, totalPages };
};

// --- API Functions ---

export const api = {
    login: async (email: string, password: string): Promise<User> => {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return delay(Promise.reject(new Error("Invalid credentials")), 1000);
        }
        if (user.isBlocked) {
            return delay(Promise.reject(new Error("Your account is blocked.")), 1000);
        }
        return delay(user);
    },

    signup: async (name: string, email: string, password: string): Promise<User> => {
        if (users.some(u => u.email === email)) {
            return delay(Promise.reject(new Error("Email already exists")), 1000);
        }
        const newUser: User = {
            id: `user-${users.length + 1}`,
            name,
            email,
            password,
            role: Role.STUDENT,
            isBlocked: false,
            createdAt: new Date(),
        };
        users.push(newUser);
        return delay(newUser);
    },
    
    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
        let user = users.find(u => u.id === userId);
        if (!user) return Promise.reject(new Error('User not found'));
        
        user = { ...user, ...data };
        users = users.map(u => u.id === userId ? user! : u);
        return delay(user);
    },
    
    changePassword: async(userId: string, oldPass: string, newPass: string): Promise<boolean> => {
        const user = users.find(u => u.id === userId);
        if(!user || user.password !== oldPass) {
            return delay(Promise.reject(new Error("Invalid current password")));
        }
        user.password = newPass;
        return delay(true);
    },

    getCourses: async (): Promise<Course[]> => delay([...courses]),
    
    addCourse: async (data: Omit<Course, 'id' | 'createdAt'>): Promise<Course> => {
        const newCourse: Course = {
            ...data,
            id: `course-${courses.length + 1}`,
            createdAt: new Date()
        };
        courses.push(newCourse);
        return delay(newCourse);
    },

    updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
        let course = courses.find(c => c.id === id);
        if (!course) return Promise.reject(new Error('Course not found'));
        
        course = { ...course, ...data };
        courses = courses.map(c => c.id === id ? course! : c);
        return delay(course);
    },

    deleteCourse: async(id: string): Promise<boolean> => {
        courses = courses.filter(c => c.id !== id);
        return delay(true);
    },

    getStudentFeedback: async (studentId: string, page: number = 1, limit: number = 5): Promise<{data: Feedback[], total: number, totalPages: number}> => {
        const studentFeedbacks = feedbacks.filter(f => f.studentId === studentId).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        return delay(paginate(studentFeedbacks, page, limit));
    },

    getAllFeedback: async(page: number = 1, limit: number = 10, filters: { courseId?: string; rating?: number } = {}): Promise<{data: Feedback[], total: number, totalPages: number}> => {
         let filtered = [...feedbacks];
        if (filters.courseId) {
            filtered = filtered.filter(f => f.courseId === filters.courseId);
        }
        if (filters.rating) {
            filtered = filtered.filter(f => f.rating === filters.rating);
        }
        const sorted = filtered.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        return delay(paginate(sorted, page, limit));
    },

    addFeedback: async(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> => {
        const newFeedback: Feedback = {
            ...feedbackData,
            id: `feedback-${feedbacks.length + 1}`,
            createdAt: new Date()
        };
        feedbacks.unshift(newFeedback);
        return delay(newFeedback);
    },

    updateFeedback: async(id: string, data: Partial<Feedback>): Promise<Feedback> => {
        let feedback = feedbacks.find(f => f.id === id);
        if (!feedback) return Promise.reject(new Error('Feedback not found'));
        
        feedback = { ...feedback, ...data };
        feedbacks = feedbacks.map(f => f.id === id ? feedback! : f);
        return delay(feedback);
    },
    
    deleteFeedback: async(id: string): Promise<boolean> => {
        feedbacks = feedbacks.filter(f => f.id !== id);
        return delay(true);
    },

    getUsers: async(page: number = 1, limit: number = 10): Promise<{data: User[], total: number, totalPages: number}> => {
        const allUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
        return delay(paginate(allUsers, page, limit));
    },
    
    updateUserStatus: async(id: string, isBlocked: boolean): Promise<User> => {
        const user = users.find(u => u.id === id);
        if(!user) return Promise.reject(new Error('User not found'));
        user.isBlocked = isBlocked;
        return delay(user);
    },
    
    deleteUser: async(id: string): Promise<boolean> => {
        users = users.filter(u => u.id !== id);
        feedbacks = feedbacks.filter(f => f.studentId !== id); // Also delete their feedback
        return delay(true);
    },
    
    getDashboardStats: async(): Promise<{studentCount: number, feedbackCount: number, courseCount: number}> => {
        const studentCount = users.filter(u => u.role === Role.STUDENT).length;
        const feedbackCount = feedbacks.length;
        const courseCount = courses.length;
        return delay({ studentCount, feedbackCount, courseCount });
    },

    getCourseRatings: async(): Promise<{name: string, avgRating: number}[]> => {
         const ratingsMap = new Map<string, { total: number; count: number }>();
        feedbacks.forEach(f => {
            if (!ratingsMap.has(f.courseId)) {
                ratingsMap.set(f.courseId, { total: 0, count: 0 });
            }
            const current = ratingsMap.get(f.courseId)!;
            current.total += f.rating;
            current.count++;
        });

        return delay(courses.map(course => ({
            name: course.name,
            avgRating: parseFloat(((ratingsMap.get(course.id)?.total || 0) / (ratingsMap.get(course.id)?.count || 1)).toFixed(2)),
        })).sort((a,b) => b.avgRating - a.avgRating));
    }
};