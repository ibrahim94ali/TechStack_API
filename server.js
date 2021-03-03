const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLID, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLFloat, GraphQLBoolean } = require("graphql");
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

const PORT = process.env.PORT || 3000;


mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.kaw9k.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(() => console.log('Connected to the db'))
.catch((err) => console.log('Error', err));

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'This is a user',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        email: {type: GraphQLNonNull(GraphQLString)},
        token: {type: GraphQLString},
        phone: {type: GraphQLNonNull(GraphQLString)},
        name: {type: GraphQLNonNull(GraphQLString)},
        surname: {type: GraphQLNonNull(GraphQLString)},
        roles: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
        verified: {type: GraphQLNonNull(GraphQLBoolean)},
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
                args: {
                    city: {type: GraphQLString},
                    minPrice: {type: GraphQLInt},
                    maxPrice: {type: GraphQLInt},
                    sortBy: {type: GraphQLString},
                    sortOrder: {type: GraphQLInt},
                },
                resolve: (_, {city, minPrice, maxPrice, sortBy, sortOrder}) => {
                    const filters = Object.assign({}, city && {city}, minPrice && {price: {$gte: minPrice}}, maxPrice && {price: {$lte: maxPrice}});

                    return Apartment.find(filters).sort({[sortBy || 'date']: sortOrder || -1});
                }

            },
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
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
                            ...user._doc,
                            id: user._id,
                            token
                        };
                    } else {
                        throw Error("Password is invalid");
                    }
                }
            },
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
                        roles: ['Admin'],
                        verified: false
                    });
                    const dbUser = await user.save();
                    const token = jwt.sign({email, userId: dbUser._id}, process.env.JWT_SECRET, {expiresIn: "7 days"});
                    return {
                        ...dbUser._doc,
                        id: user._id,
                        token
                    };
                }
            },
            // verifyUser: {
            //     type: UserType,
            //     description: 'Verify a user',
            //     args: {
            //         email: {type: GraphQLNonNull(GraphQLString)}
            //     },
            //     resolve: async (_, {email}) => {
            //         const user = await User.findOneAndUpdate({email}, {verified: true});
            //         if (!user) {
            //             throw Error("Email is not registered");
            //         }
            //         return {
            //             ...user._doc,
            //             id: user._id,
            //             verified: true
            //         };
            //     }
            // },
            updateUser: {
                type: UserType,
                description: 'Update a user',
                args: {
                    phone: {type: GraphQLString},
                    name: {type: GraphQLString},
                    surname: {type: GraphQLString}
                },
                resolve: async (_, {phone, name, surname}, {userId}) => {
                    if (!userId) {
                        throw Error("User token is invalid");
                    }
                    const newFields = Object.assign({}, phone && {phone}, name && {name}, surname && {surname});
                    const user = await User.findByIdAndUpdate(userId, newFields);
                    return {
                        ...user._doc,
                        ...newFields,
                        id: user._id,
                    }
                }
            },
            deleteUser: {
                type: UserType,
                description: 'Delete a user',
                resolve: async (_, __, {userId}) => {
                    if (!userId) {
                        throw Error("User token is invalid");
                    }
                    const user = await User.findByIdAndDelete(userId);
                    await Apartment.deleteMany({ownerId: userId});
                    return user;
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
            updateApartment: {
                type: ApartmentType,
                description: 'Update an apartment',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)},
                    title: {type: GraphQLString},
                    details: {type: GraphQLString},
                    date: {type: GraphQLString},
                    geolocation: {type: GraphQLList(GraphQLFloat)},
                    address: {type: GraphQLString},
                    city: {type: GraphQLString},
                    price: {type: GraphQLInt},
                    type: {type: GraphQLString},
                    photos: {type: GraphQLList(GraphQLString)},
                    msquare: {type: GraphQLInt},
                    roomCount: {type: GraphQLInt},
                },
                resolve: async (_, {id, title, details, date, geolocation, address, city, price, type, photos, msquare, roomCount}, {userId}) => {
                    if (!userId) {
                        throw Error("User token is invalid");
                    }
                    const newFields = Object.assign({}, title && {title}, details && {details}, date && {date}, geolocation && {geolocation}, address && {address}, city && {city}, price && {price}, type && {type}, photos && {photos}, msquare && {msquare}, roomCount && {roomCount});
                    const selectedApartment = await Apartment.findById(id);

                    if (selectedApartment._doc.ownerId.toString() !== userId.toString()) {
                        throw Error("This apartment is not assigned to this user");
                    }
                    
                    const apartment = await Apartment.findByIdAndUpdate(id, newFields);
                    return {
                        ...apartment._doc,
                        ...newFields,
                        id: apartment._id,
                    }

                }
            },
            deleteApartment: {
                type: ApartmentType,
                description: 'Delete an apartment',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)},
                },
                resolve: async (_, {id}, {userId}) => {
                    if (!userId) {
                        throw Error('User token is not valid!');
                    }
                    return Apartment.findByIdAndDelete(id);
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

app.listen(PORT, () => console.log('Server is runnning...'))