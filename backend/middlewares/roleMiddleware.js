export const roleMiddleware = (...allowRoles)=>{
    return (req,res,next) =>{
          try {

        const userRole = req.user.role;

        if(!allowRoles.includes(userRole)){
            return res.status(403).json({
                message:"Access denied"
        })
        }
        next();
        
    } catch (error) {
         return res.status(403).json({
                message:"Access denied"
        })
    }
    }
  
}