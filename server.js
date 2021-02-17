const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLID, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType } = require("graphql");
const mongoose = require("mongoose");
const cors = require("cors")

const Post = require('./models/post');
const Technology = require('./models/technology');

const app = express();

app.use(cors());
app.options('*', cors());

mongoose.connect("mongodb+srv://ibra:Bt0r0aldfC1FK66r@cluster0.4nfgi.mongodb.net/test?retryWrites=true&w=majority")
.then(() => console.log('Connected to the db'))
.catch((err) => console.log('Error', err));

const TechType = new GraphQLObjectType({
    name: 'Technology',
    description: 'This is a technology',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        posts: {
            type: GraphQLList(PostType),
            resolve: async (tech) => await Post.find({techId: tech.id}).sort({ date: -1 })
        }
    })
})

const PostType = new GraphQLObjectType({
    name: 'Post',
    description: 'This is a post',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        title: {type: GraphQLNonNull(GraphQLString)},
        owner: {type: GraphQLNonNull(GraphQLString)},
        link: {type: GraphQLNonNull(GraphQLString)},
        date: {type: GraphQLNonNull(GraphQLString)},
        techId: {type: GraphQLNonNull(GraphQLString)},
        technology: {
            type: TechType,
            resolve: async (post) => await Technology.findById({_id: post.techId})
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => (
        {
            technologies: {
                type: new GraphQLList(TechType),
                description: 'List of All Technologies',
                resolve: async () => await Technology.find().sort({name: 1})
            },
            technology: {
                type: TechType,
                description: 'Single Technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: async (_, {id}) => await Technology.findOne({_id: id})

            },
            posts: {
                type: new GraphQLList(PostType),
                description: 'List of all posts',
                resolve: async () => await Post.find()

            },
            post: {
                type: PostType,
                description: 'Single post',
                args: {id: {type: GraphQLNonNull(GraphQLID)}},
                resolve: async (_, {id}) => await Post.findOne({_id: id})
            }
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
            addTechnology: {
                type: TechType,
                description: 'Add a new technology',
                args: {
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: async (_, args) => {
                    const tech = new Technology({
                        name: args.name
                    });
                    return await tech.save();
                }
            },
            updateTechnology: {
                type: TechType,
                description: 'Update a teachnology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)},
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: async (_, {id, name}) => {
                    const newTech = new Technology({
                        _id: id,
                        name
                    });
                    return await Technology.findByIdAndUpdate({_id:id}, newTech);
                }
            },
            deleteTechnology: {
                type: TechType,
                description: 'Delete a technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: async (_, {id}) => {
                    const response = await Technology.findByIdAndRemove(id);
                    await Post.deleteMany({techId: id});
                    return response;
                }
                
            },
            addPost: {
                type: PostType,
                description: 'Add a new post',
                args: {
                    title: {type: GraphQLNonNull(GraphQLString)},
                    owner: {type: GraphQLNonNull(GraphQLString)},
                    link: {type: GraphQLNonNull(GraphQLString)},
                    date: {type: GraphQLNonNull(GraphQLString)},
                    techId: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: async (_, {title, owner, link, date, techId}) => {
                    const post = new Post({
                        title,
                        owner,
                        link,
                        date,
                        techId
                    });
                    return await post.save();
                }
            },
            updatePost: {
                type: PostType,
                description: 'Updating a post',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)},
                    title: {type: GraphQLNonNull(GraphQLString)},
                    owner: {type: GraphQLNonNull(GraphQLString)},
                    link: {type: GraphQLNonNull(GraphQLString)},
                    date: {type: GraphQLNonNull(GraphQLString)},
                },
                resolve: async (_, {id, title, owner, link, date}) => {
                  const newPost = new Post({
                      _id: id,
                      title,
                      owner,
                      link,
                      date
                  })
                  return await Post.findByIdAndUpdate({_id: id}, newPost);
                }
            },
            deletePost: {
                type: PostType,
                description: 'Delete a post',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: async (_, {id}) => await Post.findByIdAndDelete(id)
            }
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

app.listen(4000, () => console.log('Server is runnning...'))