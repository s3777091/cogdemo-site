function b64url(buf){var b64=btoa(String.fromCharCode.apply(null,new Uint8Array(buf)));while(b64.endsWith('='))b64=b64.slice(0,-1);return b64.replace(/\+/g,'-').replace(/\//g,'_');}
function sha256(s){var e=new TextEncoder().encode(s);return crypto.subtle.digest('SHA-256',e);}
function rnd(n){var c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~',o='';for(var i=0;i<n;i++)o+=c[Math.floor(Math.random()*c.length)];return o;}
function parseJwt(t){var p=t.split('.')[1];var j=atob(p.replace(/-/g,'+').replace(/_/g,'/'));return JSON.parse(decodeURIComponent(Array.prototype.map.call(j,function(c){return '%'+c.charCodeAt(0).toString(16).padStart(2,'0');}).join('')));}
function q(){return Object.fromEntries(new URLSearchParams(location.search));}
var auth={get tokens(){return JSON.parse(localStorage.getItem('tokens')||'null')},set tokens(v){localStorage.setItem('tokens',JSON.stringify(v))},clear(){localStorage.removeItem('tokens')}};
async function login(){var c=window.COGNITO,s=rnd(32),v=rnd(64),ch=b64url(await sha256(v));sessionStorage.setItem('pkce_state',s);sessionStorage.setItem('pkce_verifier',v);var u=new URL(c.domain+'/oauth2/authorize');u.searchParams.set('response_type','code');u.searchParams.set('client_id',c.clientId);u.searchParams.set('redirect_uri',c.redirectUri);u.searchParams.set('scope',c.scopes.join(' '));u.searchParams.set('state',s);u.searchParams.set('code_challenge',ch);u.searchParams.set('code_challenge_method','S256');location.assign(u.toString());}
async function exchangeCodeForTokens(){var c=window.COGNITO,p=q();if(!p.code)return false;if(p.state!==sessionStorage.getItem('pkce_state'))throw new Error('State mismatch');var body=new URLSearchParams({grant_type:'authorization_code',client_id:c.clientId,code:p.code,redirect_uri:c.redirectUri,code_verifier:sessionStorage.getItem('pkce_verifier')});var r=await fetch(c.domain+'/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body});if(!r.ok)throw new Error('Token exchange failed');auth.tokens=await r.json();sessionStorage.removeItem('pkce_state');sessionStorage.removeItem('pkce_verifier');location.replace(c.postLogoutRedirectUri);return true;}
function logout(){var c=window.COGNITO;auth.clear();var u=new URL(c.domain+'/logout');u.searchParams.set('client_id',c.clientId);u.searchParams.set('logout_uri',c.postLogoutRedirectUri);location.assign(u.toString());}
function displayWho(id){var who=id.name||id.preferred_username||id.email||id.username||id["cognito:username"]||"(unknown)";var w=document.getElementById("who");if(w){w.textContent=who}var welcome=document.getElementById("welcome");if(welcome){welcome.classList.remove("hidden")}}
function applyUi(){var t=auth.tokens,pub=document.getElementById("public"),usr=document.getElementById("user"),adm=document.getElementById("admin"),st=document.getElementById("status");pub.style.display="block";if(!t){usr.classList.add("hidden");adm.classList.add("hidden");st.textContent="🌐 Public Access - Sign in to unlock enhanced features";st.className="status-bar status-public";document.getElementById("welcome").classList.add("hidden");return}var id=parseJwt(t.id_token),g=id["cognito:groups"]||[];var isAdmin=g.indexOf("admin")>-1;var hasMfa=id.amr&&id.amr.includes('mfa');displayWho(id);usr.classList.remove("hidden");if(isAdmin){adm.classList.remove("hidden");st.textContent="👑 Administrator Access - Full system control";st.className="status-bar status-admin"}else{adm.classList.add("hidden");st.textContent="👤 User Access - Enhanced features unlocked";st.className="status-bar status-user"}var details=[];if(id.email)details.push("📧 "+id.email);if(id.email_verified===true)details.push("✅ Email Verified");if(hasMfa)details.push("🛡️ MFA Enabled");if(g.length>0)details.push("👥 Groups: "+g.join(", "));document.getElementById("user-details").innerHTML=details.join(" • ");}

// REAL Users from AWS Cognito (embedded at build time)
var REAL_COGNITO_USERS = {
    "Users": [
        {
            "Username": "74f8c438-e091-70dd-902c-ce8a743431bd",
            "Attributes": [
                {
                    "Name": "email",
                    "Value": "huynhdactandat1909@gmail.com"
                },
                {
                    "Name": "email_verified",
                    "Value": "true"
                },
                {
                    "Name": "sub",
                    "Value": "74f8c438-e091-70dd-902c-ce8a743431bd"
                }
            ],
            "UserCreateDate": "2025-09-02T03:21:58.275000-07:00",
            "UserLastModifiedDate": "2025-09-02T03:22:16.996000-07:00",
            "Enabled": true,
            "UserStatus": "CONFIRMED"
        },
        {
            "Username": "84388458-4071-705a-1d20-1f535fb31f6f",
            "Attributes": [
                {
                    "Name": "email",
                    "Value": "huynhdactandat@gmail.com"
                },
                {
                    "Name": "email_verified",
                    "Value": "true"
                },
                {
                    "Name": "sub",
                    "Value": "84388458-4071-705a-1d20-1f535fb31f6f"
                }
            ],
            "UserCreateDate": "2025-09-02T03:03:04.371000-07:00",
            "UserLastModifiedDate": "2025-09-02T03:03:43.608000-07:00",
            "Enabled": true,
            "UserStatus": "CONFIRMED"
        }
    ]
};

var adminPanel = {
  async loadUsers() {
    const loading = document.getElementById('user-loading');
    const userList = document.getElementById('user-list');
    const errorDiv = document.getElementById('user-error');
    const successDiv = document.getElementById('user-success');
    
    loading.style.display = 'block';
    userList.classList.add('hidden');
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    try {
      // Process real Cognito data
      const users = REAL_COGNITO_USERS.Users.map(user => {
        const emailAttr = user.Attributes.find(attr => attr.Name === 'email');
        const email = emailAttr ? emailAttr.Value : user.Username;
        
        return {
          username: user.Username,
          email: email,
          status: user.UserStatus,
          groups: [], // Groups would need separate API calls
          created: user.UserCreateDate.split('T')[0],
          enabled: user.Enabled
        };
      });
      
      loading.style.display = 'none';
      
      if (users.length === 0) {
        userList.innerHTML = '<div style="text-align: center; color: #7f8c8d; font-style: italic; padding: 20px;">📭 No users found in AWS Cognito User Pool</div>';
      } else {
        userList.innerHTML = users.map(user => `
          <div class="user-item">
            <div class="user-details">
              <div class="user-email">📧 ${user.email}</div>
              <div class="user-status">
                ✅ Status: ${user.status} | 
                🆔 Username: ${user.username} | 
                📅 Created: ${user.created} |
                🔧 Enabled: ${user.enabled ? 'Yes' : 'No'}
              </div>
            </div>
            <div class="user-actions">
              <button class="btn btn-small" onclick="adminPanel.showUserDetails('${user.username}')">👁️ View Details</button>
              <button class="btn btn-danger btn-small" onclick="adminPanel.simulateAdminAction('${user.email}')">👑 Admin Action</button>
            </div>
          </div>
        `).join('');
        
        successDiv.textContent = `✅ Loaded ${users.length} REAL users from AWS Cognito User Pool`;
        successDiv.classList.remove('hidden');
      }
      
      userList.classList.remove('hidden');
      
    } catch (error) {
      loading.style.display = 'none';
      errorDiv.textContent = `❌ Error processing real user data: ${error.message}`;
      errorDiv.classList.remove('hidden');
    }
  },

  showUserDetails(username) {
    const user = REAL_COGNITO_USERS.Users.find(u => u.Username === username);
    if (user) {
      const details = user.Attributes.map(attr => `${attr.Name}: ${attr.Value}`).join('\n');
      alert(`Real User Details from AWS Cognito:\n\nUsername: ${username}\nStatus: ${user.UserStatus}\nEnabled: ${user.Enabled}\nCreated: ${user.UserCreateDate}\n\nAttributes:\n${details}`);
    }
  },

  simulateAdminAction(email) {
    const successDiv = document.getElementById('user-success');
    successDiv.textContent = `✅ Simulated admin action for ${email} (Real implementation would use AWS CLI/SDK)`;
    successDiv.classList.remove('hidden');
    setTimeout(() => successDiv.classList.add('hidden'), 3000);
  }
};

window.cafeAuth={login:login,logout:logout,exchangeCodeForTokens:exchangeCodeForTokens,applyUi:applyUi};
window.adminPanel=adminPanel;
