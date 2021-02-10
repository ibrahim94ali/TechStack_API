const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLInt, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType } = require("graphql");
let { players, teams } = require("./data");

const app = express();

const PlayerType = new GraphQLObjectType({
    name: 'Player',
    description: 'This is a player',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        teamId: {type: GraphQLNonNull(GraphQLInt)},
        team: {
            type: TeamType,
            resolve: (player) => teams.find(team => team.id === player.teamId) 
        }
    })
})

const TeamType = new GraphQLObjectType({
    name: 'Team',
    description: 'This is a team',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        players: {
            type: GraphQLList(PlayerType), 
            resolve: (team) => players.filter(player => player.teamId === team.id)
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => (
        {
            players: {
                type: new GraphQLList(PlayerType),
                description: 'List of All Players',
                resolve: () => players
            },
            teams: {
                type: new GraphQLList(TeamType),
                description: 'List of All Teams',
                resolve: () => teams
            },
            player: {
                type: PlayerType,
                description: 'Single Player',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (player, args) => players.find(player => player.id === args.id)
            },
            team: {
                type: TeamType,
                description: 'Single Team',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (team, args) => teams.find(team => team.id === args.id)

            }
        }
    )
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => (
        {
            addPlayer: {
                type: PlayerType,
                description: 'Add a Player',
                args: {
                    name: { type: GraphQLNonNull(GraphQLString) },
                    teamId: { type: GraphQLNonNull(GraphQLInt) }, 
                },
                resolve: (parent, args) => {
                    const player = {
                        id: players.length + 1,
                        name: args.name,
                        teamId: args.teamId
                    }
                    players.push(player)
                    return player
                }
            },
            updatePlayer: {
                type: PlayerType,
                description: 'Update a player',
                args: {
                    id: { type: GraphQLNonNull(GraphQLInt)},
                    name: { type: GraphQLString},
                    teamId: { type: GraphQLInt}
                },
                resolve: (parent, args) => {
                    const playerIndex = players.findIndex(player => player.id === args.id);
                    players[playerIndex] = {
                        id: args.id,
                        name: args.name || players[playerIndex].name,
                        teamId: args.teamId || players[playerIndex].teamId
                    };
                    return players[playerIndex];
                }
            },
            deletePlayer: {
                type: PlayerType,
                description: 'Delete a player',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (parent, args) => {
                    const playerIndex = players.findIndex(player => player.id === args.id);
                    const player = players[playerIndex];
                    players = [...players.slice(0, playerIndex), ...players.slice(playerIndex + 1)];
                    return player;
                }
            },
            addTeam: {
                type: TeamType,
                description: 'Add a new team',
                args: {
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: (parent, args) => {
                    const team = {
                        id: teams.length + 1,
                        name: args.name
                    };
                    teams.push(team);
                    return team;
                }
            },
            updateTeam: {
                type: TeamType,
                description: 'Update a team',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)},
                    name: {type: GraphQLNonNull(GraphQLString)}
                },
                resolve: (parent, args) => {
                    const teamIndex = teams.findIndex(team => team.id === args.id);
                    teams[teamIndex] = {
                        id: args.id,
                        name: args.name
                    };
                    return teams[teamIndex];
                }
            },
            deleteTeam: {
                type: TeamType,
                description: 'Delete a team',
                args: {
                    id: {type: GraphQLNonNull(GraphQLInt)}
                },
                resolve: (parent, args) => {
                    const teamIndex = teams.findIndex(team => team.id === args.id);
                    const team = teams[teamIndex];
                    teams = [...teams.slice(0, teamIndex), ...teams.slice(teamIndex+1)];
                    return team;
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

app.listen(5000, () => console.log('Server is runnning...'))