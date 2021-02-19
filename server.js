const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLID, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLFloat } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors")

const User = require('./models/user');
const Apartment = require('./models/apartment');

const app = express();

app.use(cors());
app.options('*', cors());
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.kaw9k.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(() => console.log('Connected to the db'))
.catch((err) => console.log('Error', err));

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'This is a user',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        email: {type: GraphQLNonNull(GraphQLString)},
        phone: {type: GraphQLNonNull(GraphQLString)},
        name: {type: GraphQLNonNull(GraphQLString)},
        surname: {type: GraphQLNonNull(GraphQLString)},
        roles: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
    })
})

const ApartmentType = new GraphQLObjectType({
    name: 'Apartment',
    description: 'This is an apartment',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        title: {type: GraphQLNonNull(GraphQLString)},
        details: {type: GraphQLNonNull(GraphQLString)},
        ownerId: {type: GraphQLNonNull(GraphQLID)},
        date: {type: GraphQLNonNull(GraphQLString)},
        geolocation: {type: GraphQLNonNull(GraphQLList(GraphQLFloat))},
        address: {type: GraphQLNonNull(GraphQLString)},
        price: {type: GraphQLNonNull(GraphQLInt)},
        type: {type: GraphQLNonNull(GraphQLString)},
        photos: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
        msquare: {type: GraphQLNonNull(GraphQLInt)},
        roomCount: {type: GraphQLNonNull(GraphQLInt)},
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => (
        {
            users: {
                type: new GraphQLList(UserType),
                description: 'List of all users',
                resolve: async () => await User.find()
            },
            apartments: {
                type: new GraphQLList(ApartmentType),
                description: 'List of all apartments',
                resolve: async () => await Apartment.find()

            },
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
            addUser: {
                type: UserType,
                description: 'Add a new user',
                args: {
                    email: {type: GraphQLNonNull(GraphQLString)},
                    password: {type: GraphQLNonNull(GraphQLString)},
                    phone: {type: GraphQLNonNull(GraphQLString)},
                    name: {type: GraphQLNonNull(GraphQLString)},
                    surname: {type: GraphQLNonNull(GraphQLString)},
                },
                resolve: async (_, {email, password, phone, name, surname}) => {
                    const hashedPass = await bcrypt.hash(password, 10);
                    const user = new User({
                        email,
                        password: hashedPass,
                        phone,
                        name,
                        surname,
                        roles: ['Admin']
                    });
                    return await user.save();
                }
            },
            addApartment: {
                type: ApartmentType,
                description: 'Add a new apartment',
                args: {
                    title: {type: GraphQLNonNull(GraphQLString)},
                    details: {type: GraphQLNonNull(GraphQLString)},
                    ownerId: {type: GraphQLNonNull(GraphQLID)},
                    date: {type: GraphQLNonNull(GraphQLString)},
                    geolocation: {type: GraphQLNonNull(GraphQLList(GraphQLFloat))},
                    address: {type: GraphQLNonNull(GraphQLString)},
                    price: {type: GraphQLNonNull(GraphQLInt)},
                    type: {type: GraphQLNonNull(GraphQLString)},
                    photos: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
                    msquare: {type: GraphQLNonNull(GraphQLInt)},
                    roomCount: {type: GraphQLNonNull(GraphQLInt)},
                },
                resolve: async (_, {title, details, ownerId, date, geolocation, address, price, type, photos, msquare, roomCount}) => {
                    const apartment = new Apartment({
                        title,
                        details,
                        ownerId,
                        date,
                        geolocation,
                        address,
                        price,
                        type,
                        photos,
                        msquare,
                        roomCount
                       
                    });
                    return await apartment.save();
                }
            },
        }
    )
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
}));

app.listen(3000, () => console.log('Server is runnning...'))