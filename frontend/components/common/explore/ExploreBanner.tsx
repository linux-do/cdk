'use client';

import {useState, useEffect} from 'react';
import {Badge} from '@/components/ui/badge';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi} from '@/components/ui/carousel';
import {formatDateTimeWithSeconds} from '@/lib/utils';
import {ProjectListItem} from '@/lib/services/project/types';
import Autoplay from 'embla-carousel-autoplay';

export interface ExploreBannerProps {
  randomProjects?: ProjectListItem[];
  onProjectClick?: (project: ProjectListItem) => void;
}

/**
 * 探索页面横幅组件
 */
export function ExploreBanner({
  randomProjects = [],
  onProjectClick = () => {},
}: ExploreBannerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    const handleSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', handleSelect);

    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  const totalPages = 1 + randomProjects.length;

  const WelcomeCard = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl p-8 text-white h-[250px]">
      <div className="relative z-10 h-full flex flex-col justify-center text-center">
        <h1 className="text-3xl lg:text-4xl font-bold mb-6">
          欢迎使用 Linux Do CDK
        </h1>
        <p className="text-blue-100 text-lg">
          高效分发省时省力，快速领取快人一步
        </p>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
    </div>
  );

  const ProjectCard = ({project}: {project: ProjectListItem}) => {
    const visibleTags = project.tags?.slice(0, 3) || [];

    return (
      <div
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl p-8 text-white cursor-pointer hover:from-blue-700 hover:via-blue-800 hover:to-purple-900 transition-colors duration-300 h-[250px]"
        onClick={() => onProjectClick(project)}
      >
        <div className="relative z-10 h-full flex flex-col">
          <div className="text-center mb-4 mt-8">
            <div className="text-3xl md:text-4xl font-bold">{project.name}</div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs text-white">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="absolute -top-4 -right-4 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-col items-center">
            <div className="text-blue-200 text-xs mt-1">剩余</div>
            <div className="text-3xl font-bold leading-none text-center">{project.total_items}</div>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-auto">
            <div className="text-center">
              <div className="text-blue-200 text-xs font-medium mb-2">开始时间</div>
              <div className="text-white font-semibold text-sm leading-tight">
                {formatDateTimeWithSeconds(project.start_time)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-200 text-xs font-medium mb-2">结束时间</div>
              <div className="text-white font-semibold text-sm leading-tight">
                {formatDateTimeWithSeconds(project.end_time)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-200 text-xs font-medium mb-2">最低风险等级</div>
              <div className="text-white font-semibold text-sm leading-tight">
                {project.risk_level}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-200 text-xs font-medium mb-2">最低信任等级</div>
              <div className="text-white font-semibold text-sm leading-tight">
                {project.minimum_trust_level}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      </div>
    );
  };

  return (
    <div className="mb-8">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{align: 'start', loop: true}}
        plugins={[
          // eslint-disable-next-line new-cap
          Autoplay({
            delay: 4000,
          }),
        ]}
      >
        <CarouselContent>
          <CarouselItem>
            <WelcomeCard />
          </CarouselItem>

          {randomProjects.map((project) => (
            <CarouselItem key={project.id}>
              <ProjectCard project={project} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-4 bg-accent/60 border-none hidden md:flex" />
        <CarouselNext className="right-4 bg-accent/60 border-none hidden md:flex" />
      </Carousel>


      <div className="flex justify-center mt-4 gap-1.5">
        {Array.from({length: totalPages}).map((_, index) => (
          <button
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              index === current - 1 ?
                'bg-blue-600 scale-125' :
                'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`切换到第 ${index + 1} 页`}
          />
        ))}
      </div>
    </div>
  );
}
