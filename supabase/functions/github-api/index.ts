import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  languages_url: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

interface StackDetection {
  language: string | null;
  framework: string | null;
  buildTool: string | null;
  confidence: number;
}

// Language to framework/build tool mapping
const languageConfig: Record<string, { frameworks: string[], buildTools: string[] }> = {
  'TypeScript': { 
    frameworks: ['React', 'Next.js', 'Angular', 'Vue', 'NestJS', 'Express'],
    buildTools: ['npm', 'yarn', 'pnpm', 'vite', 'webpack']
  },
  'JavaScript': { 
    frameworks: ['React', 'Vue', 'Express', 'Next.js', 'Node.js'],
    buildTools: ['npm', 'yarn', 'webpack', 'vite']
  },
  'Python': { 
    frameworks: ['Django', 'FastAPI', 'Flask', 'Streamlit'],
    buildTools: ['pip', 'poetry', 'pipenv', 'conda']
  },
  'Java': { 
    frameworks: ['Spring Boot', 'Quarkus', 'Micronaut'],
    buildTools: ['Maven', 'Gradle']
  },
  'Go': { 
    frameworks: ['Gin', 'Echo', 'Fiber', 'Chi'],
    buildTools: ['go mod', 'make']
  },
  'Rust': { 
    frameworks: ['Actix', 'Rocket', 'Axum'],
    buildTools: ['Cargo']
  },
  'C#': { 
    frameworks: ['.NET Core', 'ASP.NET', 'Blazor'],
    buildTools: ['dotnet', 'MSBuild']
  },
  'Ruby': { 
    frameworks: ['Rails', 'Sinatra', 'Hanami'],
    buildTools: ['Bundler', 'rake']
  },
  'PHP': { 
    frameworks: ['Laravel', 'Symfony', 'CodeIgniter'],
    buildTools: ['Composer']
  }
};

async function detectStack(token: string, owner: string, repo: string): Promise<StackDetection> {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Opzenix-Pipeline'
  };

  // Get languages
  const langResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/languages`,
    { headers }
  );
  
  let primaryLanguage: string | null = null;
  if (langResponse.ok) {
    const languages = await langResponse.json();
    const sorted = Object.entries(languages).sort(([,a], [,b]) => (b as number) - (a as number));
    primaryLanguage = sorted.length > 0 ? sorted[0][0] : null;
  }

  // Try to detect framework from package.json or other config files
  let framework: string | null = null;
  let buildTool: string | null = null;
  let confidence = 0.5;

  // Check for package.json (Node.js projects)
  try {
    const pkgResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers }
    );
    
    if (pkgResponse.ok) {
      const pkgData = await pkgResponse.json();
      const content = atob(pkgData.content);
      const pkg = JSON.parse(content);
      
      // Detect framework from dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps['next']) framework = 'Next.js';
      else if (deps['react']) framework = 'React';
      else if (deps['vue']) framework = 'Vue';
      else if (deps['@angular/core']) framework = 'Angular';
      else if (deps['express']) framework = 'Express';
      else if (deps['@nestjs/core']) framework = 'NestJS';
      
      // Detect build tool from scripts
      if (pkg.scripts?.build?.includes('vite')) buildTool = 'vite';
      else if (pkg.scripts?.build?.includes('webpack')) buildTool = 'webpack';
      else if (deps['vite']) buildTool = 'vite';
      else buildTool = 'npm';
      
      confidence = 0.9;
    }
  } catch (e) {
    console.log('No package.json found');
  }

  // Check for Python projects
  if (!framework && (primaryLanguage === 'Python')) {
    try {
      const reqResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`,
        { headers }
      );
      
      if (reqResponse.ok) {
        const reqData = await reqResponse.json();
        const content = atob(reqData.content);
        
        if (content.includes('django')) framework = 'Django';
        else if (content.includes('fastapi')) framework = 'FastAPI';
        else if (content.includes('flask')) framework = 'Flask';
        
        buildTool = 'pip';
        confidence = 0.85;
      }
    } catch (e) {
      // Try pyproject.toml
      try {
        const pyprojectResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/pyproject.toml`,
          { headers }
        );
        if (pyprojectResponse.ok) {
          buildTool = 'poetry';
          confidence = 0.8;
        }
      } catch (e2) {
        console.log('No Python config found');
      }
    }
  }

  // Check for Java projects
  if (!framework && primaryLanguage === 'Java') {
    try {
      const pomResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/pom.xml`,
        { headers }
      );
      if (pomResponse.ok) {
        const pomData = await pomResponse.json();
        const content = atob(pomData.content);
        if (content.includes('spring-boot')) framework = 'Spring Boot';
        buildTool = 'Maven';
        confidence = 0.9;
      }
    } catch (e) {
      try {
        const gradleResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/build.gradle`,
          { headers }
        );
        if (gradleResponse.ok) {
          buildTool = 'Gradle';
          confidence = 0.85;
        }
      } catch (e2) {
        console.log('No Java config found');
      }
    }
  }

  // Check for Go projects
  if (!framework && primaryLanguage === 'Go') {
    try {
      const goModResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/go.mod`,
        { headers }
      );
      if (goModResponse.ok) {
        const goModData = await goModResponse.json();
        const content = atob(goModData.content);
        if (content.includes('gin-gonic')) framework = 'Gin';
        else if (content.includes('echo')) framework = 'Echo';
        else if (content.includes('fiber')) framework = 'Fiber';
        buildTool = 'go mod';
        confidence = 0.85;
      }
    } catch (e) {
      console.log('No go.mod found');
    }
  }

  // Set defaults from language config
  if (!framework && primaryLanguage && languageConfig[primaryLanguage]) {
    framework = languageConfig[primaryLanguage].frameworks[0];
    confidence = 0.6;
  }
  
  if (!buildTool && primaryLanguage && languageConfig[primaryLanguage]) {
    buildTool = languageConfig[primaryLanguage].buildTools[0];
  }

  return {
    language: primaryLanguage,
    framework,
    buildTool,
    confidence
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, token, owner, repo, userId } = await req.json();

    // Validate token first
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'GitHub token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Opzenix-Pipeline'
    };

    switch (action) {
      case 'validate-token': {
        const response = await fetch('https://api.github.com/user', { headers });
        if (!response.ok) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const user = await response.json();
        
        // Get scopes from response headers
        const scopes = response.headers.get('X-OAuth-Scopes')?.split(', ') || [];
        
        // Store token if userId provided
        if (userId) {
          await supabase.from('github_tokens').upsert({
            user_id: userId,
            encrypted_token: token, // In production, encrypt this
            token_type: 'pat',
            scopes,
            last_validated_at: new Date().toISOString(),
            is_valid: true
          }, { onConflict: 'user_id' });
          
          // Update profile with GitHub username
          await supabase.from('profiles').update({
            github_username: user.login
          }).eq('id', userId);
        }
        
        return new Response(
          JSON.stringify({
            valid: true,
            user: {
              login: user.login,
              name: user.name,
              avatar_url: user.avatar_url,
              email: user.email
            },
            scopes
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-repos': {
        const allRepos: GitHubRepo[] = [];
        let page = 1;
        const perPage = 100;
        
        // Fetch all repos with pagination
        while (true) {
          const response = await fetch(
            `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
            { headers }
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch repositories');
          }
          
          const repos = await response.json() as GitHubRepo[];
          allRepos.push(...repos);
          
          if (repos.length < perPage) break;
          page++;
          if (page > 10) break; // Safety limit
        }
        
        // Format repos for frontend
        const formattedRepos = allRepos.map(r => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          isPrivate: r.private,
          url: r.html_url,
          description: r.description,
          defaultBranch: r.default_branch,
          language: r.language,
          updatedAt: r.updated_at,
          owner: {
            login: r.owner.login,
            avatarUrl: r.owner.avatar_url
          }
        }));
        
        return new Response(
          JSON.stringify({ repos: formattedRepos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-branches': {
        if (!owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'Owner and repo are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
          { headers }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch branches');
        }
        
        const branches = await response.json() as GitHubBranch[];
        
        return new Response(
          JSON.stringify({
            branches: branches.map(b => ({
              name: b.name,
              sha: b.commit.sha,
              protected: b.protected
            }))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'detect-stack': {
        if (!owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'Owner and repo are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const stack = await detectStack(token, owner, repo);
        
        return new Response(
          JSON.stringify({ stack }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-commit': {
        if (!owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'Owner and repo are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { branch = 'main' } = await req.json();
        
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
          { headers }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch commit');
        }
        
        const commit = await response.json();
        
        return new Response(
          JSON.stringify({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-orgs': {
        const response = await fetch('https://api.github.com/user/orgs', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        
        const orgs = await response.json();
        
        return new Response(
          JSON.stringify({
            organizations: orgs.map((o: any) => ({
              login: o.login,
              id: o.id,
              avatarUrl: o.avatar_url,
              description: o.description
            }))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('GitHub API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});