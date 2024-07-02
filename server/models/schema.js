const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')

const dataSchema= new mongoose.Schema({

    User_name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
       
    },
    password:{
        type:String,
        require:true,
    },
    user_Id:{
        type:Number,
        require:true

    },
    profile_image:{
        type:String,
        require:true,
        default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
    },
   
    Followers:{
        type:Array,
        default:Array
    },
    Following:{
        type:Array,//array length for number of following
        default:Array,
       
    },
    post_details:{

        type :Array,
        default:[
        {   
            postDesc: String,
            likes: Number,
            postId:String
        }
        ]
        
      },

    Shared:{
        type:Array,
        default:[]
    },
    comment:{
        type:Array,
      
    },

    
        
        
        
    },
    



   
    
)
dataSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next()
    }
    const salt=await bcrypt.genSalt(10)
    this.password=await bcrypt.hash(this.password,salt)

})
//checking hash passoword
dataSchema.methods.matchPassword=async function(enterpassword){
    return await bcrypt.compare(enterpassword,this.password)
}

    
const user=mongoose.model('users',dataSchema)

module.exports=user