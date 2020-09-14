
const router = require('express').Router();

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const swaggerOptions = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Algofab API",
			description: "TODO description",
			contact: {
				name: "TODO contact"
			},
			servers: ['http://localhost:3000'],
			tags: [
				{
					name: "Users",
					description: "All operations related to user management"
				},
				{
					name: "Resources",
					description: "All operations related to resources management"
				},
				{
					name: "LivaData",
					description: "All operations related to Live Data management"
				}
			]	
		},
		// securityDefinitions: {
		// 	ApiKeyAuth: {       
		// 	    type: "apiKey",
		// 	    in: "header",
		// 	    name: "X-API-KEY"
		// 	}
		// },
		components:{
			securitySchemes:{
				ApiKeyAuth: {
					type: "apiKey",
					in: "header",
					name: "X-API-KEY"
				}
			}
		},
		security:[ 
			{ApiKeyAuth: []}
		],
		definitions: {
			userProfile: {
				type: "object",
				properties: {
					firstname: { type: "string", description: "TODO", example: "John"},
					lastname: { type: "string", description: "TODO", example: "DOE"},
					status: { type: "string", description: "TODO", example: "user"},
					username: { type: "string", description: "TODO", example: "jdoe"},
					emails: { 
						type: "array", 
						items : {
							type: "object",
							properties: {
								email : { type: "string", description: "TODO", example: "jdoe@example.com"},
								verified: { type: "boolean", description: "TODO", example: false}
							}
						}
					},
					email : { type: "string", description: "TODO", example: "jdoe@example.com"},
					photo: {
						type: "string",
						format: "binary"
					}
				}
			},
			userPreferences: {
				type: "object",
				properties: {}
			},
			groups: {
				type: "object",
				properties:{
					name: { type: "string", description: "TODO", example: "Groupe g1" }
				}
			},
			users: {
				type: "object",
				properties: {
					profile: { schema: "#/definitions/userProfile" },
					preferences: { schema: "#/definitions/userPreferences" },
					groups: { type: "array", itmes: { schema: "#/definitions/groups" } }
				}
			},

			tags:{
				tpye: "object",
				properties: {
					name: {type: "string", description: "TODO", example: "tag1"},
					value: {type: "string", description: "TODO", example: "val1"}
				}
			},
			resourceMetadata: {
				type: "object",
				properties: {
					name: { type : "string", description: "TODO", example: "Resource r1"},
					version: { type : "string", description: "TODO", example : "1.0.0" },
					short_intro: { type : "string", description: "TODO", example : "Just a simple and short introduction." },
					description : { type : "string", description: "TODO", example : "<p>Here a full <em>HTML formatted</em> description we can render later on to present this resource.</p>" },
					documentations : {
						type: "object",
						properties: {
							media_type: { type: "string", description: "TODO", example: "html" },
							details: { type: "object" }
						}
					},
					docs_type: { type: "string", description: "TODO", example: "html" },
					docs_details:{ type: "string", description: "TODO"},
					logo: { 
						type: "object",
						properties:{ 
							content_type: { type: "string", description: "TODO", example: "html" }, 
							buffer: { type: "string", format: "binary", description: "TODO" } 
						},
					},
					logoFile: { type: "string", format: "binary" },
					tags: {
						type: "array",
						items: { 
							type: "object",
							properties: {
								name : { type: "string", description: "TODO", example: "t1" },
								value: { type: "string", description: "TODO", example: "value1" }, 
							}
						}
					},
					asset_type: { type: "string", description: "TODO", example: "notebook" },
					private: { type : "boolean", description: "TODO", example : false },
					licence: { type: "string", description: "TODO" },
					agreement: { type: "string", description: "TODO" }
				}
			},
			liveData: {
				type : "object",
				properties: {
					apiVersion: {type:"string", description: "TODO", example: "v1"},
					name: {type:"string", description: "TODO", example: "My LD One"},
					type: {type:"string", description: "TODO", example: "empty"},
					description: {type:"string", description: "TODO", example: "My LD One"},
					sshKeys: {
						type: "array",
						items: { type: "string", description: "TODO", example: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyMqfs5QAnPb0xLqEg2Vt4T1gS/Btw1X5r0JGhKwLEfpImciY4RiDOc0Sq3BK8CVwUN9316EIE31lgvnZ9+TCRdj4XSc/2O49EgTUzEzqrdT5RvFAPOPeklDDVhrbi75P94xeYM0qiJhcmYmloqGG1dSla1oGLdDXi9GzlnCoAOXl3yhHMzman0hbwJiHDwVvyTdegDo0ZvKoPYbaV41Bm2IobH/URrLQYDZCCUAB4JWZd6DcSsbEYGEKgI3NvcqO3Z6dn+eRlHJxqQZ4Qos0ZT9LRffWvUM3ocWsJ5aqXuml2pA0Or8oVbfNhej8P9VhvFSH8FkXPhQpSCuxfYXCb skante@skante-virtual-machine"}
					},
					// spec: { 
					// 	type: "object" 
					// }
				}
			}
		}
	},
	apis:['routes/*']
}

const swaggerDoc = swaggerJSDoc(swaggerOptions);

router.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDoc));
/**
* 	========== EXAMPLE ==========
* @swagger
* /users:
*   get:
*     description: TODO
*     parameters: 
*       - name: name
*         description: TODO
*         in: query
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         schema:
*           $ref: schema
*           
*/



module.exports = router;