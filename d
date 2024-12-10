[1mdiff --git a/src/controllers/cv.controller.js b/src/controllers/cv.controller.js[m
[1mindex adbfc35..3cc369b 100644[m
[1m--- a/src/controllers/cv.controller.js[m
[1m+++ b/src/controllers/cv.controller.js[m
[36m@@ -18,9 +18,7 @@[m [mconst listcvfiles = asyncHandler(async(req,res)=>{[m
             return res.status(404).json({ message: 'No CVs found for this user' });[m
         }[m
 [m
[31m-        const cvFilePaths = cvEntries.map(cv => cv.cvFileUrl);[m
[31m-[m
[31m-        return res.status(200).json({ cvFilePaths });[m
[32m+[m[32m        return res.status(200).json(cvEntries)[m
 [m
 })[m
 [m
[36m@@ -39,7 +37,6 @@[m [mconst uploadCvFile = asyncHandler(async(req,res)=>{[m
         [m
             const cvLocalPath = req.file.path[m
         [m
[31m-        [m
             const cvContent = await extractTextFromPDF(cvLocalPath)[m
         [m
 [m
[1mdiff --git a/src/controllers/interview.controller.js b/src/controllers/interview.controller.js[m
[1mindex e7ce5d9..4543b42 100644[m
[1m--- a/src/controllers/interview.controller.js[m
[1m+++ b/src/controllers/interview.controller.js[m
[36m@@ -77,10 +77,9 @@[m [mconst startInterviewSession = asyncHandler(async (req,res)=>{[m
       {[m
         role: "user",[m
         content: `Please review the following CV and job description. [m
[31m-                  - If the CV matches the job description, return: { "match": true, "suggestion": "" } dont add any comment just just the return response as asked when its true.[m
[31m-                  - If the CV does not match the job description, return: { "match": false, "suggestion":  suggestion the user for other positions the user should consider based on the CV} [m
[31m-                  - if the job description and cv has the same domain but with different experience level should be considered matched and return true.[m
[31m-                  - similar domains and fields should be matched true. (this should be given importance)[m
[32m+[m[32m                  1 If the CV matches the job description, return: { "match": true, "suggestion": "" } dont add any comment just just the return response as asked when its true.[m
[32m+[m[32m                  2 If the CV does not match the job description, return: { "match": false, "suggestion":  suggestion the user for other positions the user should consider based on the CV}[m[41m [m
[32m+[m[32m                  3 if the job description and cv has the same domain (field) but with different experience level should be considered matched and return true.[m
                   CV: ${cvTextInput}[m
                   [m
                   Job Description: ${jobDescription}`,[m
[36m@@ -95,9 +94,11 @@[m [mconst startInterviewSession = asyncHandler(async (req,res)=>{[m
     });[m
     console.log(response.choices[0].message.content)[m
     const modelResponse= response.choices[0].message.content;[m
[31m-    //const matchResult = JSON.parse(modelResponse);[m
[31m-   // console.log(matchResult)[m
[31m-    if (!modelResponse.match) {[m
[32m+[m[32m    const matchResult = JSON.parse(modelResponse);[m
[32m+[m
[32m+[m[32m    console.log("this is false " ,matchResult.match)[m
[32m+[m[32m    if (!matchResult.match) {[m
[32m+[m[32m      console.log("ABCD TEST")[m
         return res.status(200).json(new ApiResponse (200,{matchResult},"The user CV doesn't Match with the Job Description"));[m
     }[m
   }catch(error){[m
[1mdiff --git a/src/middlewares/multer.middleware.js b/src/middlewares/multer.middleware.js[m
[1mindex b0afdab..dc29f7d 100644[m
[1m--- a/src/middlewares/multer.middleware.js[m
[1m+++ b/src/middlewares/multer.middleware.js[m
[36m@@ -13,11 +13,8 @@[m [mconst storage = multer.diskStorage({[m
 [m
 // Set up file filter to only accept PDFs[m
 const fileFilter = (req, file, cb) => {[m
[31m-  if (file.mimetype === 'application/pdf') {[m
[31m-      cb(null, true); // Accept the file[m
[31m-  } else {[m
[31m-      cb(new Error('Only PDFs are allowed'), false); // Reject the file[m
[31m-  }[m
[32m+[m[32m      cb(null, true); // Reject the file[m
[32m+[m[41m  [m
 };[m
 [m
 // Initialize multer with storage and file filter configuration[m
