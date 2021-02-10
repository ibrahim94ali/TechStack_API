const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLInt, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType } = require("graphql");
let { technologies, people, posts } = require("./data");

const app = express();

const PersonType = new GraphQLObjectType({
    name: 'Person',
    description: 'This is a person',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        techIds: {type: GraphQLNonNull(GraphQLList(GraphQLInt))},
        technologies: {
            type: GraphQLList(TechType),
            resolve: (person) => technologies.filter(tech => person.techIds.includes(tech.id)) 
        }
    })
})

const TechType = new GraphQLObjectType({
    name: 'Technology',
    description: 'This is a technology',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        people: {
            type: GraphQLList(PersonType), 
            resolve: (tech) => people.filter(person => person.techIds.includes(tech.id))
        },
        posts: {
            type: GraphQLList(PostType),
            resolve: (tech) => posts.filter(post => post.techId === tech.id)
        }
    })
})

const PostType = new GraphQLObjectType({
    name: 'Post',
    description: 'This is a post',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        title: {type: GraphQLNonNull(GraphQLString)},
        link: {type: GraphQLNonNull(GraphQLString)},
        techId: {type: GraphQLNonNull(GraphQLInt)},
        technology: {
            type: TechType,
            resolve: (post) => technologies.find(tech => tech.id === post.id)
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => (
        {
            people: {
                type: new GraphQLList(PersonType),
                description: 'List of All People',
                resolve: () => people
            },
            technologies: {
                type: new GraphQLList(TechType),
                description: 'List of All Technologies',
                resolve: () => technologies
            },
            person: {
                type: PersonType,
                description: 'Single Person',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, args) => people.find(person => person.id === args.id)
            },
            technology: {
                type: TechType,
                description: 'Single Technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, args) => technologies.find(tech => tech.id === args.id)

            },
            posts: {
                type: new GraphQLList(PostType),
                description: 'List of all posts',
                resolve: () => posts
            },
            post: {
                type: PostType,
                description: 'Single post',
                args: {id: {type: GraphQLNonNull(GraphQLInt)}},
                resolve: (_, {id}) => posts.find(post => post.id === id)
            }
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
            addPerson: {
                type: PersonType,
                description: 'Add a Person',
                args: {
                    name: { type: GraphQLNonNull(GraphQLString) },
                    techIds: { type: GraphQLNonNull(GraphQLList(GraphQLInt)) }, 
                },
                resolve: (_, args) => {
                    const person = {
                        id: people.length + 1,
                        name: args.name,
                        techIds: args.techIds
                    };
                    people.push(person);
                    return person;
                }
            },
            updatePerson: {
                type: PersonType,
                description: 'Update a person',
                args: {
                    id: { type: GraphQLNonNull(GraphQLInt)},
                    name: { type: GraphQLString},
                    techIds: { type: GraphQLList(GraphQLInt)}
                },
                resolve: (_, args) => {
                    const personIndex = people.findIndex(person => person.id === args.id);
                    people[personIndex] = {
                        id: args.id,
                        name: args.name || people[personIndex].name,
                        techIds: args.techIds || people[personIndex].techIds
                    };
                    return people[personIndex];
                }
            },
            deletePerson: {
                type: PersonType,
                description: 'Delete a person',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, args) => {
                    const personIndex = people.findIndex(person => person.id === args.id);
                    const person = people[personIndex];
                    people = [...people.slice(0, personIndex), ...people.slice(personIndex + 1)];
                    return person;
                }
            },
            addTechnology: {
                type: TechType,
                description: 'Add a new technology',
                args: {
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: (_, args) => {
                    const tech = {
                        id: technologies.length + 1,
                        name: args.name
                    };
                    technologies.push(tech);
                    return tech;
                }
            },
            updateTechnology: {
                type: TechType,
                description: 'Update a teachnology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)},
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: (_, args) => {
                    const techIndex = technologies.findIndex(tech => tech.id === args.id);
                    technologies[techIndex] = {
                        id: args.id,
                        name: args.name
                    };
                    return technologies[techIndex];
                }
            },
            deleteTechnology: {
                type: TechType,
                description: 'Delete a technology',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, args) => {
                    const techIndex = technologies.findIndex(tech => tech.id === args.id);
                    const tech = technologies[techIndex];
                    technologies = [...technologies.slice(0, techIndex), ...technologies.slice(techIndex+1)];
                    return tech;
                }
            },
            addPost: {
                type: PostType,
                description: 'Add a new post',
                args: {
                    title: {type: GraphQLNonNull(GraphQLString)},
                    link: {type: GraphQLNonNull(GraphQLString)},
                    techId: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, {title, link, techId}) => {
                    const post = {
                        id: posts.length + 1,
                        title,
                        link,
                        techId
                    };
                    posts.push(post);
                    return post;
                }
            },
            updatePost: {
                type: PostType,
                description: 'Updating a post',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)},
                    title: {type: GraphQLString},
                    link: {type: GraphQLString},
                    techId: {type: GraphQLInt},
                },
                resolve: (_, {id, title, link, techId}) => {
                    const postIndex = posts.findIndex(post => post.id === id);
                    posts[postIndex] = {
                        id,
                        title: title || posts[postIndex].title,
                        link: link || posts[postIndex].link,
                        techId: techId || posts[postIndex].techId
                    };
                    return posts[postIndex];
                }
            },
            deletePost: {
                type: PostType,
                description: 'Delete a post',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (_, {id}) => {
                    const postIndex = posts.findIndex(post => post.id === id);
                    const post = posts[postIndex];
                    posts = [...posts.slice(0, postIndex), ...posts.slice(postIndex + 1)];
                    return post;
                }
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

app.listen(5000, () => console.log('Server is runnning...'))