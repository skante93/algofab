
exports.settings = {
    "cl-prod" : {
        MONGO : "mongodb://192.168.0.17:27017/algofab",
        PORTAL_EXT_PROTOCOL : 'https://',
        PORTAL_EXT_ADDR : 'portal.algofab.fr',
        
        PORTAL_PROTOCOL : 'https://',
        PORTAL_ADDR : '192.168.0.15',
        PORTAL_PORT : 443,

        SOCKET_PORT : 8050,

        IM_PROTOCOL : 'http://',
        IM_ADDR : '192.168.0.16',
        IM_PORT : 32080,
        IM_EXT_ADDR : '84.39.51.48',
        
        RH_PROTOCOL : 'https://',
        RH_ADDR : '192.168.0.4',
        RH_PORT : 443,
        RH_EXT_ADDR : 'rh.algofab.fr',
    },
    "cl-dev" : {
        MONGO : "mongodb://192.168.0.6:27018/algofab",

        PORTAL_EXT_PROTOCOL : 'https://',
        PORTAL_EXT_ADDR : 'portail.hopto.org',
        
        PORTAL_PROTOCOL : 'https://',
        PORTAL_ADDR : '192.168.0.3',
        PORTAL_PORT : 443,

        IM_PROTOCOL : 'http://',
        IM_ADDR : '192.168.0.5',
        IM_PORT : 32080,
        IM_EXT_ADDR : '84.39.52.9',

        RH_PROTOCOL : 'https://',
        RH_ADDR : '192.168.0.11',
        RH_PORT : 443,
        RH_EXT_ADDR : 'req-handler.hopto.org',
    },
    "tl-prod" : {
        MONGO : 'mongodb://'+(process.env.MONGO_SERVICE_HOST ? process.env.MONGO_SERVICE_HOST : 'mongo')+"/algofab",

        LDAP : { 
            server : `ldap://${process.env.LDAP_SERVICE_HOST ? process.env.LDAP_SERVICE_HOST : 'ldap'}`, 
            DN : process.env.LDAP_BASE_DN, 
            credential : { 
                login : `cn=admin,${process.env.LDAP_BASE_DN}`,  
                password : process.env.LDAP_PASSWORD
            }
        },

        DEMO_URL: "192.168.43.141", 
        DEMO : { 
            name : "ws37.tl.teralab-datascience.fr" , 
            port_range: { min : 33000, max : 35767}, 
            certs : undefined
        },
        ARTICLE_CATEGORIES: {
            technical: [ 
                { id: 0, name: "Algorithm Selection", icon: ""},
                { id: 1, name: "Collaborative AI", icon: ""},
                { id: 2, name: "Computational logic", icon: ""},
                { id: 3, name: "Computer vision", icon: ""},
                { id: 4, name: "Constraints and SAT", icon: ""},
                { id: 5, name: "Decision support systems", icon: ""},
                { id: 6, name: "Explicable AI", icon: ""},
                { id: 7, name: "Heuristic search &amp; game playing", icon: ""},
                { id: 8, name: "Integrative AI", icon: ""},
                { id: 9, name: "Knowledge representation &amp; reasoning", icon: ""},
                { id: 10, name: "Machine Learning", icon: ""},
                { id: 11, name: "Multi-agent systems", icon: ""},
                { id: 12, name: "Natural language &amp; dialogue processing", icon: ""},
                { id: 13, name: "Physical AI", icon: ""},
                { id: 14, name: "Planning", icon: ""},
                { id: 15, name: "Probabilistic models", icon: ""},
                { id: 16, name: "Speech and signal processing", icon: ""},
                { id: 17, name: "Verifiable AI", icon: ""}
            ],
            business: [ 
                { id: 0, name: "AI for agriculture", icon: ""},
                { id: 1, name: "AI in autonomous driving and mobility", icon: ""},
                { id: 2, name: "AI for law", icon: ""},
                { id: 3, name: "AI in retail and ecommerce", icon: ""},
                { id: 4, name: "AI in Human Resources", icon: ""},
                { id: 5, name: "AI in health", icon: ""},
                { id: 6, name: "AI for telecommunication", icon: ""},
                { id: 7, name: "AI for robotics", icon: ""},
                { id: 8, name: "AI for media", icon: ""},
                { id: 9, name: "AI for IoT", icon: ""},
                { id: 10, name: "AI for ambient intelligence", icon: ""},
                { id: 11, name: "AI for industry and manufacturing", icon: ""},
                { id: 12, name: "AI for finance &amp; insurance", icon: ""},
                { id: 13, name: "AI for environment and sustainability", icon: ""},
                { id: 14, name: "AI for cybersecurity", icon: ""},
                { id: 15, name: "AI for citizen services &amp; education", icon: ""},
                { id: 16, name: "AI for art and music", icon: ""},
                { id: 17, name: "AI in software engineering", icon: ""},
                { id: 18, name: "Trusted and Privacy preserving AI", icon: ""}
            ],
            types: [ 
                { id: 0, name: "Dataset", icon: "/img/dataset.svg"},
                { id: 1, name: "Executable", icon: "/img/executable.svg"},
                { id: 2, name: "AI model", icon: "/img/ai_model.svg"},
                { id: 3, name: "Docker container", icon: "/img/docker.svg"},
                { id: 4, name: "Jupyter Notebook", icon: "/img/notebook.svg"},
                { id: 5, name: "As a Service", icon: "/img/service.svg"},
                { id: 6, name: "Library", icon: "/img/library.svg"}
            ]
        },
        DOCS: [

            {
                id_: "docs_index",
                title: "Documentation",
                name: "Documentation index",
                template: "docs/index",
                sub: [
                    {
                        id: "manage_resources",
                        title: "Manage Resources",
                        name: "Manage Resources",
                        template: "docs/resources/intro",
                        sub: [
                            {
                                id: "create_resources",
                                title: "Create Resources",
                                name: "Create Resources",
                                template: "docs/resources/create",
                                
                            },
                            {
                                id: "edit_resources",
                                title: "Edit Resources",
                                name: "Edit Resources",
                                template: "docs/resources/edit",
                                
                            },
                            {
                                id: "delete_resources",
                                title: "Delete Resources",
                                name: "Delete Resources",
                                template: "docs/resources/delete",
                                
                            },
                        ]
                    },

                    {
                        id: "manage_user_account",
                        title: "Manage User Account",
                        name: "Manage User Account",
                        template: "docs/account/intro",
                        sub: [
                            {
                                id: "create_user_account",
                                title: "Create User Account",
                                name: "Create User Account",
                                template: "docs/account/create",
                            },
                            {
                                id: "edit_user_account",
                                title: "Edit User Account",
                                name: "Edit User Account",
                                template: "docs/account/edit",
                            } ,

                            {
                                id: "delelte_user_account",
                                title: "Delete User Account",
                                name: "Delete User Account",
                                template: "docs/account/delete",
                            } 

                        ]
                    }
                ]
            },
            
            {
                id: "algorithms",
                title: "Old Archives",
                name: "Old Archives",
                template: "docs/getting_started/intro",
                sub: [
                    {
                        id: "getting_started",
                        title: "Getting Started", 
                        name: "Getting Started", 
                        template: "docs/getting_started/intro",
                        sub: [
                            {
                                id: "getting_started_intro",
                                title: "Getting Started | Introduction",
                                name: "Introduction",
                                template: "docs/getting_started/intro"
                            },

                            {
                                id: "getting_started_algo",
                                title: "Getting Started | Algorithm",
                                name: " Algorithm",
                                template: "docs/getting_started/algo"
                            },

                            {
                                id: "getting_started_docker",
                                title: "Getting Started | Docker",
                                name: "Docker",
                                template: "docs/getting_started/docker"
                            },

                            {
                                id: "getting_started_api",
                                title: "Getting Started | API",
                                name: "API",
                                template: "docs/getting_started/algo"
                            },

                        ]
                    }
                ]
            },
            {
                id: "glossary",
                title: "Glossary",
                name: "Glossary",
                template: "docs/glossary",
                
            }
        ],
        PORTAL_EXT_PROTOCOL : 'https://',
        //PORTAL_EXT_ADDR : 'ws37-kube-dev-portal.tl.teralab-datascience.fr',
        PORTAL_EXT_ADDR : 'ws67-af-portal.tl.teralab-datascience.fr',
        
        RH_EXT_PROTOCOL : 'https://',
        // RH_EXT_ADDR : 'ws37-kube-dev-rh.tl.teralab-datascience.fr',
        RH_EXT_ADDR : 'ws67-af-rh.tl.teralab-datascience.fr',

        PORTAL_PROTOCOL : 'http://',
        PORTAL_ADDR : 'portal',
        PORTAL_PORT : 8080,

        RH_PROTOCOL : 'http://',
        RH_ADDR : 'rh',
        RH_PORT : 3000,

        IM_PROTOCOL : 'http://',
        IM_ADDR : process.env.IM_SERVICE_HOST,
        IM_PORT : 32080,
    },
    "tl-dev" : {
        MONGO : "mongodb://10.32.5.135:27018/dev_algofab",

        LDAP : { 
            server : "ldap://ws37-cl2-en12", 
            DN : "dc=ldap,dc=algofab,dc=fr", 
            credential : { 
                login : "cn=admin,dc=ldap,dc=algofab,dc=fr",  
                password : "pass"
            }
        },

        DEMO : { 
            name : "ws37.tl.teralab-datascience.fr" , 
            port_range: { min : 36000, max : 38767}, 
            certs : undefined
        },

        PORTAL_EXT_PROTOCOL : 'https://',
        PORTAL_EXT_ADDR : 'ws37-portal-dev.tl.teralab-datascience.fr',

        RH_EXT_PROTOCOL : 'https://',
        RH_EXT_ADDR : 'ws37-rh-dev.tl.teralab-datascience.fr',

        PORTAL_PROTOCOL : 'http://',
        PORTAL_ADDR : 'localhost',
        PORTAL_PORT : 8080,

        RH_PROTOCOL : 'http://',
        RH_ADDR : '10.32.5.24',
        RH_PORT : 3000,

        IM_PROTOCOL : 'http://',
        IM_ADDR : 'localhost',
        IM_PORT : 32080,
    }
}

exports.default = "tl-prod";