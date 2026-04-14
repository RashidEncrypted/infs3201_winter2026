(Made Secure by hiding uri + comments added for better readability)
    01/03/26

## Test Users

Username: admin  
Password: admin123  

Username: staff  
Password: staff123  

## Notes
- Passwords are stored as SHA256 hashes in MongoDB
- Sessions expire after 5 minutes
- Each request extends session validity
- To verify hashes, run:
node -e "const crypto=require('crypto');console.log('admin123:',crypto.createHash('sha256').update('admin123').digest('hex'));console.log('staff123:',crypto.createHash('sha256').update('staff123').digest('hex'));"