require('dotenv').config();
const express = require('express');
const expressGraphQL = require('express-graphql').graphqlHTTP
const app = express();

const mongoose = require('mongoose');
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');
const Course = require('../course');

mongoose.connect('mongodb://127.0.0.1:27017/course', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

const CourseType = new GraphQLObjectType({
    name: 'Course',
    description: 'This represents a course',
    fields: () => ({
        _id: { type: GraphQLNonNull(GraphQLString) },
        code: { type: GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLNonNull(GraphQLString) },
        section: { type: GraphQLNonNull(GraphQLString) },
        semester: { type: GraphQLNonNull(GraphQLString) }
    })
});

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        course: {
            type: CourseType,
            description: 'A Single Course',
            args: {
                _id: { type: GraphQLString }
            },
            resolve: async (parent, args) => {
                const course = await Course.findById(args._id);
                return course;
            }
        },
        courses: {
            type: new GraphQLList(CourseType),
            description: 'List of All Courses',
            resolve: async () => {
                const courses = await Course.find();
                return courses;
            }
        }
    })
});

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
        addCourse: {
            type: CourseType,
            description: 'Add a Course',
            args: {
                code: { type: GraphQLNonNull(GraphQLString) },
                name: { type: GraphQLNonNull(GraphQLString) },
                section: { type: GraphQLNonNull(GraphQLString) },
                semester: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const course = new Course({
                    code: args.code,
                    name: args.name,
                    section: args.section,
                    semester: args.semester
                });
                const newCourse = await course.save();
                return newCourse;
            }
        },
        updateCourse: {
            type: CourseType,
            description: 'Update a Course',
            args: {
                _id: { type: GraphQLNonNull(GraphQLString) },
                code: { type: GraphQLNonNull(GraphQLString) },
                name: { type: GraphQLNonNull(GraphQLString) },
                section: { type: GraphQLNonNull(GraphQLString) },
                semester: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const course = await Course.findByIdAndUpdate(args._id, {
                    code: args.code,
                    name: args.name,
                    section: args.section,
                    semester: args.semester
                }, { new: true });
                return course;
            }
        }, 
        deleteCourse: {
            type: CourseType,
            description: 'Delete a Course',
            args: {
                _id: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                try {
                    const deletedCourse = await Course.findByIdAndRemove(args._id);
                    if (!deletedCourse) {
                        throw new Error('Course not found');
                    }
                    return deletedCourse;
                } catch (err) {
                    throw new Error(err);
                }
            }
        }
    })
});

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use(express.json())
const cors = require('cors');
app.use(cors())

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}))

app.listen(4000, () => {
    console.log('Server running on port 4000')
})

module.exports = app;
