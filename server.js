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
            resolve: (tech) => Post.find({techId: tech.id})
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
            resolve: (post) => Technology.findById({_id: post.techId})
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
                resolve: () => Technology.find()
            },
            technology: {
                type: TechType,
                description: 'Single Technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: (_, {id}) => Technology.findOne({_id: id})

            },
            posts: {
                type: new GraphQLList(PostType),
                description: 'List of all posts',
                resolve: () => Post.find()

            },
            post: {
                type: PostType,
                description: 'Single post',
                args: {id: {type: GraphQLNonNull(GraphQLID)}},
                resolve: (_, {id}) => Post.findOne({_id: id})
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
                resolve: (_, args) => {
                    const tech = new Technology({
                        name: args.name
                    });
                    return tech.save();
                }
            },
            updateTechnology: {
                type: TechType,
                description: 'Update a teachnology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)},
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: (_, {id, name}) => {
                    const newTech = new Technology({
                        _id: id,
                        name
                    });
                    return Technology.findByIdAndUpdate({_id:id}, newTech);
                }
            },
            deleteTechnology: {
                type: TechType,
                description: 'Delete a technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: (_, {id}) =>Technology.findByIdAndRemove(id)
                
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
                resolve: (_, {title, owner, link, date, techId}) => {
                    const post = new Post({
                        title,
                        owner,
                        link,
                        date,
                        techId
                    });
                    return post.save();
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
                resolve: (_, {id, title, owner, link, date}) => {
                  const newPost = new Post({
                      _id: id,
                      title,
                      owner,
                      link,
                      date
                  })
                  return Post.findByIdAndUpdate({_id: id}, newPost);
                }
            },
            deletePost: {
                type: PostType,
                description: 'Delete a post',
                args: {
                    id: {type: GraphQLNonNull(GraphQLID)}
                },
                resolve: (_, {id}) => Post.findByIdAndDelete(id)
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