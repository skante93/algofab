
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
			userJSONSignupObject: {
				type: "object",
				properties: {
					firstname: { type: "string", description: "TODO", example: "John"},
					lastname: { type: "string", description: "TODO", example: "DOE"},
					status: { type: "string", description: "TODO", example: "user", enum: ["user", "admin"]},
					username: { type: "string", description: "TODO", example: "jdoe", required: true},
					email : { type: "string", description: "TODO", example: "jdoe@example.com", required: true}
				}
			},

			userMultipartSignupObject: {
				allOf: [
					{ $ref: "#/definitions/userJSONSignupObject" },
					{
						type: "object",
						properties: {
							photo: {
								type: "string",
								format: "binary"
							}
						}
					}
				]
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
					//apiVersion: {type:"string", description: "TODO", example: "v1"},
					name: {type:"string", description: "TODO", example: "My LD One"},
					type: {type:"string", description: "TODO", example: "empty"},
					description: {type:"string", description: "TODO", example: "My LD One"},
					sshKeys: {
						type: "array",
						items: { type: "string", description: "TODO", example: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDM3pTuOmKUmv0BiEQORKxu+GFeJlCuG67m0GyKzGFTqNhlzRqgC/C+oFJn/Lk4Kqu/uXOzzOHeebnCrrb89z/mIEfE4Hp5vKfs4o0neQXrtia/dpddfGXqZLgBArwi4eIVqVmC8g1qOXbTZ1MA9Eax8cajTrrBPN8GH+eOzbPZUYmhcA3CLnQvXxZef6bohBurMY7Yah19Nr8/3lHJcGx3C9HOtofjs+S4RDE6YxO8xY8Bwd8buW8d2YpDaqoD3O93wrkN3tZocB88pRIoQ08vUJmKjRx1ycHwIFM0N/0N7+S8ET2FcgapA8hfKG5v51OM5kLp7SXc/Ta5SI1Pi6RR skante@flecorre-tl-tower"}
					},
					// spec: { 
					// 	type: "object" 
					// }
				}
			},

			algoInstance: {
				type: 'object',
				properties: {
					name: {type:"string", description: "TODO", example: "My Instance one of Algo one"},
					inputs: { type: "object" },
					output: { type: "object" },
					settings: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: {type:"string", description: "TODO", example: "var1"},
								value: {type:"string", description: "TODO", example: "val1"},
							}
						}
					},
					liveDataMountPoints: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: {type:"string", description: "TODO", example: "ldone"},
								liveDataID: {type:"string", description: "TODO", example: "#myPersonalLiveData#"}
							}
						}
					},
					templateID: { type: "string", description: "TODO", example: "#ID-Of-The-Algo-Template#",required: true}
				}
			},
			algoTemplate: {
				type: 'object',
				properties: {
					name: {type:"string", description: "TODO", example: "My Algo one"},
					description: {type:"string", description: "TODO", example: "Super description for Algo One"},
					inputs: { type: "object" },
					output: { type: "object" },
					settings: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: {type:"string", description: "TODO", example: "var1"},
								type: {type:"string", description: "TODO", example: "integer"},
								description: {type:"string", description: "TODO", example: "We use var1 to do such and such ..."},
								required: { type: "boolean", example: true },
								default: {type: "string", example: "defaultValForVar1"}
							}
						}
					},
					container: {
						type: "object",
						properties: {
							image: {type:"string", description: "TODO", example: "myDockerHubLogin/myImage:myTag"},
							ports: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: {type:"string", description: "TODO", example: "http"},
										description: {type:"string", description: "TODO", example: "My http port exposing ..."},
										containerPort: {type:"integer", description: "TODO", example: 80}
									}
								}
							}
						}
					},
					liveDataMountPoints: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: {type:"string", description: "TODO", example: "ldOne"},
								description: {type:"string", description: "TODO", example: "This liveData solves ...."},
								mountPoint: {type:"string", description: "TODO", example: "/dataset-ld-one"}
							}
						}
					}
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