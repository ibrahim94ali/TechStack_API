const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLID, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLFloat } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors")
const checkAuth = require("./middleware/checkAuth");

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
        token: {type: GraphQLNonNull(GraphQLString)},
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
        city: {type: GraphQLNonNull(GraphQLString)},
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
                resolve: () => User.find()
            },
            apartments: {
                type: new GraphQLList(ApartmentType),
                description: 'List of all apartments',
                resolve: () => Apartment.find()

            },
            login: {
                type: UserType,
                description: 'Login a user',
                args: {
                    email: {type: GraphQLNonNull(GraphQLString)},
                    password: {type: GraphQLNonNull(GraphQLString)},
                },
                resolve: async (_, {email, password}) => {
                    const user = await User.findOne({email});
                    if(!user) {
                        throw Error("Email is invaid");
                    }
                    const truePass = await bcrypt.compare(password, user.password);

                    if(truePass) {
                        const token = jwt.sign({email: user.email, userId: user._id}, process.env.JWT_SECRET, {expiresIn: "7 days"});
                        return {
                            email: user.email,
                            id: user._id,
                            token,
                            name: user.name,
                            surname: user.surname,
                            phone: user.phone,
                            roles: user.roles
                        };
                    } else {
                        throw Error("Password is invalid");
                    }
                }
            }
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
            register: {
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
                    return user.save();
                }
            },
            addApartment: {
                type: ApartmentType,
                description: 'Add a new apartment',
                args: {
                    title: {type: GraphQLNonNull(GraphQLString)},
                    details: {type: GraphQLNonNull(GraphQLString)},
                    date: {type: GraphQLNonNull(GraphQLString)},
                    geolocation: {type: GraphQLNonNull(GraphQLList(GraphQLFloat))},
                    address: {type: GraphQLNonNull(GraphQLString)},
                    city: {type: GraphQLNonNull(GraphQLString)},
                    price: {type: GraphQLNonNull(GraphQLInt)},
                    type: {type: GraphQLNonNull(GraphQLString)},
                    photos: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
                    msquare: {type: GraphQLNonNull(GraphQLInt)},
                    roomCount: {type: GraphQLNonNull(GraphQLInt)},
                },
                resolve: async (_, {title, details, date, geolocation, address, city, price, type, photos, msquare, roomCount}, {userId}) => {
                    if (!userId) {
                        throw Error('User token is not valid!');
                    }
                    const apartment = new Apartment({
                        title,
                        details,
                        date,
                        geolocation,
                        address,
                        city,
                        price,
                        type,
                        photos,
                        msquare,
                        roomCount,
                        ownerId: userId,
                    });
                    return apartment.save();
                }
            },
        }
    )
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
});

app.use(checkAuth);

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
}));

app.listen(3000, () => console.log('Server is runnning...'))